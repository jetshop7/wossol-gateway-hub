import type { Prisma } from "@prisma/client";

export type CatalogTaxonomyLevel = "SEGMENT" | "FAMILY" | "CLASS" | "BRICK";

export type AdminTaxonomyLabel = {
  id: string;
  sourceCode: string;
  name: string;
  level: CatalogTaxonomyLevel;
};

export type AdminTaxonomySelection = AdminTaxonomyLabel & {
  breadcrumb: AdminTaxonomyLabel[];
};

export function activeProductBrickWhere(id?: string): Prisma.CatalogTaxonomyNodeWhereInput {
  return {
    ...(id ? { id } : {}),
    level: "BRICK",
    status: "ACTIVE",
    OR: [
      { source: "WOSSOL_EXTENSION" },
      { source: "GS1_GPC", release: { is: { isActive: true, status: "ACTIVE" } } },
    ],
  };
}

export function activeGs1TaxonomyNodeWhere(
  id?: string,
): Prisma.CatalogTaxonomyNodeWhereInput {
  return {
    ...(id ? { id } : {}),
    source: "GS1_GPC",
    status: "ACTIVE",
    release: { is: { isActive: true, status: "ACTIVE" } },
  };
}
