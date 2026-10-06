import assert from "node:assert/strict";
import test from "node:test";

import {
  assertProductTaxonomyNode,
  browseAdminTaxonomyNodes,
  getAdminCompany,
  searchAdminTaxonomyNodes,
} from "./catalog.admin.repository.server.ts";
import { getWossolExportPrisma } from "./prisma.server.ts";

const databaseAvailable = Boolean(process.env.WOSSOL_EXPORT_DATABASE_URL);

test(
  "active GS1 taxonomy search and browse share Brick identity and preserve bilingual labels",
  {
    skip: !databaseAvailable,
  },
  async () => {
    const prisma = getWossolExportPrisma();
    try {
      const roots = await browseAdminTaxonomyNodes(null, 0);
      assert.ok(roots.nodes.length > 0);
      assert.ok(roots.nodes.every((node) => node.level === "SEGMENT"));
      assert.ok(roots.nodes.length <= 100);

      const segment = roots.nodes[0]!;
      const families = await browseAdminTaxonomyNodes(segment.id, 0);
      assert.ok(families.nodes.length > 0);
      assert.ok(families.nodes.every((node) => node.level === "FAMILY"));

      const classes = await browseAdminTaxonomyNodes(families.nodes[0]!.id, 0);
      assert.ok(classes.nodes.length > 0);
      assert.ok(classes.nodes.every((node) => node.level === "CLASS"));

      const bricks = await browseAdminTaxonomyNodes(classes.nodes[0]!.id, 0);
      assert.ok(bricks.nodes.length > 0);
      assert.ok(bricks.nodes.every((node) => node.level === "BRICK"));

      const brick = bricks.nodes[0]!;
      const searchResults = await searchAdminTaxonomyNodes(brick.sourceCode);
      const searchedBrick = searchResults.find((node) => node.id === brick.id);
      assert.ok(searchedBrick, "GPC code search should return the browsed Brick");
      const nameResults = await searchAdminTaxonomyNodes(brick.name);
      assert.ok(
        nameResults.some((node) => node.id === brick.id),
        "English taxonomy label search should return the browsed Brick",
      );
      assert.deepEqual(
        searchedBrick.breadcrumb.map(({ level }) => level),
        ["SEGMENT", "FAMILY", "CLASS", "BRICK"],
      );
      assert.ok(searchedBrick.breadcrumb.every(({ name }) => name.length > 0));
      assert.equal(searchedBrick.sourceCode, brick.sourceCode);

      assert.deepEqual(await searchAdminTaxonomyNodes("  "), []);
      await assertProductTaxonomyNode(brick.id);
      await assert.rejects(
        assertProductTaxonomyNode(segment.id),
        /active Brick from the current taxonomy release/,
      );
      await assert.rejects(
        browseAdminTaxonomyNodes(brick.id, 0),
        /Brick is the final taxonomy level/,
      );

      const frenchTranslation = await prisma.catalogTaxonomyTranslation.findFirst({
        where: { nodeId: brick.id, languageCode: "FR" },
        select: { name: true },
      });
      assert.ok(frenchTranslation?.name, "existing FR translation remains available");

    const classifiedProduct = await prisma.product.findFirst({
      where: { taxonomyNodeId: { not: null } },
        select: { companyId: true, taxonomyNodeId: true },
      });
      if (classifiedProduct?.companyId) {
        const company = await getAdminCompany(classifiedProduct.companyId);
        const product = company?.products.find(
          (item) => item.taxonomyNodeId === classifiedProduct.taxonomyNodeId,
        );
        assert.equal(product?.taxonomyNode?.id, classifiedProduct.taxonomyNodeId);
        assert.equal(product?.taxonomyNode?.breadcrumb.at(-1)?.level, "BRICK");
      }
    } finally {
      await prisma.$disconnect();
    }
  },
);
