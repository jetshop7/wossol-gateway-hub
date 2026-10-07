import { Prisma } from "@prisma/client";

import { getWossolExportPrisma } from "./prisma.server.ts";

/**
 * Authoritative SQL visibility policy for future Client catalog reads.
 * Taxonomy descendants are traversed at query time; one rule row is stored per
 * selected node, regardless of how many descendants it currently has.
 */
export async function findClientVisibleProductIds(
  clientAccountId: string,
  options: { productId?: string; take?: number; skip?: number } = {},
) {
  const take = Math.max(1, Math.min(100, Math.trunc(options.take ?? 50)));
  const skip = Math.max(0, Math.trunc(options.skip ?? 0));
  const productFilter = options.productId
    ? Prisma.sql`AND p.id = ${options.productId}::uuid`
    : Prisma.empty;
  const taxonomyProductFilter = options.productId
    ? Prisma.sql`WHERE p.id = ${options.productId}::uuid AND p.taxonomy_node_id IS NOT NULL`
    : Prisma.sql`WHERE p.taxonomy_node_id IS NOT NULL`;

  const rows = await getWossolExportPrisma().$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH RECURSIVE product_taxonomy_ancestors(product_id, node_id) AS (
      SELECT p.id, node.id
      FROM catalog_products AS p
      JOIN catalog_taxonomy_nodes AS node ON node.id = p.taxonomy_node_id
      ${taxonomyProductFilter}
      UNION ALL
      SELECT ancestors.product_id, parent.id
      FROM product_taxonomy_ancestors AS ancestors
      JOIN catalog_taxonomy_nodes AS node ON node.id = ancestors.node_id
      JOIN catalog_taxonomy_nodes AS parent ON parent.id = node.parent_id
    )
    SELECT p.id
    FROM catalog_products AS p
    JOIN catalog_companies AS company ON company.id = p.company_id
    JOIN export_client_accounts AS account ON account.id = ${clientAccountId}::uuid
    WHERE p.publication_status = 'PUBLISHED'
      AND company.status = 'ACTIVE'
      AND account.status = 'ACTIVE'
      AND account.catalog_access_status = 'ENABLED'
      ${productFilter}
      AND (
        account.catalog_access_mode = 'ALL_APPROVED'
        OR EXISTS (
          SELECT 1
          FROM export_client_catalog_visibility_rules AS include_rule
          WHERE include_rule.client_account_id = account.id
            AND include_rule.effect = 'INCLUDE'
            AND (
              (include_rule.target_type = 'COMPANY' AND include_rule.company_id = p.company_id)
              OR (include_rule.target_type = 'PRODUCT' AND include_rule.product_id = p.id)
              OR (
                include_rule.target_type = 'TAXONOMY'
                AND EXISTS (
                  SELECT 1
                  FROM product_taxonomy_ancestors AS ancestor
                  WHERE ancestor.product_id = p.id
                    AND ancestor.node_id = include_rule.taxonomy_node_id
                )
              )
            )
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM export_client_catalog_visibility_rules AS exclude_rule
        WHERE exclude_rule.client_account_id = account.id
          AND exclude_rule.effect = 'EXCLUDE'
          AND (
            (exclude_rule.target_type = 'COMPANY' AND exclude_rule.company_id = p.company_id)
            OR (exclude_rule.target_type = 'PRODUCT' AND exclude_rule.product_id = p.id)
            OR (
              exclude_rule.target_type = 'TAXONOMY'
              AND EXISTS (
                SELECT 1
                FROM product_taxonomy_ancestors AS excluded_ancestor
                WHERE excluded_ancestor.product_id = p.id
                  AND excluded_ancestor.node_id = exclude_rule.taxonomy_node_id
              )
            )
          )
      )
    ORDER BY p.name ASC, p.id ASC
    LIMIT ${take} OFFSET ${skip}
  `);
  return rows.map((row) => row.id);
}

export async function isClientProductVisible(clientAccountId: string, productId: string) {
  const ids = await findClientVisibleProductIds(clientAccountId, { productId, take: 1 });
  return ids.includes(productId);
}
