import assert from "node:assert/strict";
import test from "node:test";
import {
  parseGpcImportJson,
  parseGpcImportXml,
  parseGpcImportXmlDocument,
  importGpcMultilingualRelease,
  gpcNodeId,
  planGpcImport,
  validateGpcImportRows,
  type GpcImportRow,
  type GpcTransactionRunner,
} from "./gs1-gpc-import.ts";
import { activeProductBrickWhere } from "./catalog.taxonomy.ts";
import { getWossolExportPrisma } from "./prisma.server.ts";

const validRows: GpcImportRow[] = [
  { sourceCode: "TEST-SEG", level: "SEGMENT", name: "Synthetic Segment" },
  { sourceCode: "TEST-FAM", level: "FAMILY", name: "Synthetic Family", parentCode: "TEST-SEG" },
  { sourceCode: "TEST-CLS", level: "CLASS", name: "Synthetic Class", parentCode: "TEST-FAM" },
  {
    sourceCode: "TEST-BRK",
    level: "BRICK",
    name: "Synthetic Brick",
    description: "TEST ONLY",
    parentCode: "TEST-CLS",
  },
];

test("accepts a complete four-level release with direct parent links", () => {
  assert.deepEqual(validateGpcImportRows(validRows), []);
});

test("rejects duplicate source codes before any import writes", () => {
  const rows = [...validRows, { ...validRows[3]!, name: "Duplicate" }];
  assert.ok(
    validateGpcImportRows(rows).some((error) => error.message.includes("Duplicate source code")),
  );
});

test("rejects missing and wrong-level parents", () => {
  const missing = validRows.map((row) =>
    row.sourceCode === "TEST-BRK" ? { ...row, parentCode: "MISSING" } : row,
  );
  assert.ok(validateGpcImportRows(missing).some((error) => error.message.includes("is missing")));
  const wrongLevel = validRows.map((row) =>
    row.sourceCode === "TEST-BRK" ? { ...row, parentCode: "TEST-SEG" } : row,
  );
  assert.ok(
    validateGpcImportRows(wrongLevel).some((error) => error.message.includes("must be a CLASS")),
  );
});

test("rejects invalid roots, incomplete releases, and self replacement", () => {
  const rows = validRows.map((row) =>
    row.sourceCode === "TEST-SEG"
      ? { ...row, parentCode: "TEST-FAM" }
      : row.sourceCode === "TEST-BRK"
        ? { ...row, replacementCode: "TEST-BRK" }
        : row,
  );
  const errors = validateGpcImportRows(rows.filter((row) => row.level !== "CLASS"));
  assert.ok(errors.some((error) => error.message.includes("Segment cannot have a parent")));
  assert.ok(errors.some((error) => error.message.includes("cannot replace itself")));
  assert.ok(errors.some((error) => error.message.includes("missing CLASS")));
});

test("accepts only the explicit versioned JSON interchange envelope", () => {
  const parsed = parseGpcImportJson({ nodes: validRows });
  assert.equal(parsed.length, 4);
  assert.throws(() => parseGpcImportJson({ categories: validRows }), /"nodes" array/);
  assert.throws(
    () => parseGpcImportJson({ nodes: [{ sourceCode: 42, level: "BRICK", name: "Bad" }] }),
    /requires string/,
  );
});

test("parses the official nested XML hierarchy and preserves entity-decoded descriptions", () => {
  const xml = `<schema><segment code="TEST-SEG" text="Food &amp; Drink"><family code="TEST-FAM" text="Staples"><class code="TEST-CLS" text="Grains"><brick code="TEST-BRK" text="Rice &amp; grains" description="Official test definition"/></class></family></segment></schema>`;
  const rows = parseGpcImportXml(xml);
  assert.deepEqual(
    rows.map(({ level }) => level),
    ["SEGMENT", "FAMILY", "CLASS", "BRICK"],
  );
  assert.equal(rows[3]?.name, "Rice & grains");
  assert.equal(rows[3]?.description, "Official test definition");
  assert.equal(rows[3]?.parentCode, "TEST-CLS");
  assert.throws(
    () => parseGpcImportXml('<!DOCTYPE schema [<!ENTITY x SYSTEM "file:///secret">]><schema/>'),
    /DOCTYPE/,
  );
});

test("reads GS1 language and publication date metadata without inventing missing translations", () => {
  const english = parseGpcImportXmlDocument(
    '<schema languageCode="EN" dateUtc="20/5/2026"><segment code="S" text="English" /></schema>',
  );
  const french = parseGpcImportXmlDocument(
    '<schema languageCode="FR" dateUtc="20/5/2026"><segment code="S" text="Français" /></schema>',
  );
  assert.equal(english.sourceVersion, "2026-05");
  assert.equal(english.languageCode, "EN");
  assert.equal(french.languageCode, "FR");
  assert.notEqual(english.rows[0]?.name, french.rows[0]?.name);
  assert.throws(
    () => parseGpcImportXmlDocument('<schema languageCode="AR" dateUtc="20/5/2026"/>'),
    /languageCode must be EN or FR/,
  );
  assert.throws(
    () => parseGpcImportXmlDocument('<schema languageCode="EN" dateUtc="31/2/2026"/>'),
    /not a valid calendar date/,
  );
});

test("rejects bilingual files whose codes or hierarchy differ", async () => {
  const french = validRows.map((row) => ({ ...row, name: `FR ${row.name}` }));
  french[3] = { ...french[3]!, parentCode: "TEST-SEG" };
  const result = await importGpcMultilingualRelease("2026-05", [
    { languageCode: "EN", rows: validRows },
    { languageCode: "FR", rows: french },
  ]);
  assert.ok(result.errors.some((error) => error.message.includes("does not match EN")));
});

test("import planning is idempotent, version-scoped, and archives missing nodes without deleting", () => {
  const existing = validRows.map((row) => ({
    ...row,
    description: row.description ?? null,
    parentCode: row.parentCode ?? null,
    status: "ACTIVE",
    deprecatedAt: null as Date | null,
  }));
  assert.deepEqual(planGpcImport(validRows, existing), {
    created: [],
    updated: [],
    unchanged: validRows.map((row) => row.sourceCode),
    deprecated: [],
  });
  const nextVersionHasSameCodes = planGpcImport(validRows, []);
  assert.equal(nextVersionHasSameCodes.created.length, 4);
  const withoutBrick = planGpcImport(validRows.slice(0, 3), existing);
  assert.deepEqual(withoutBrick.deprecated, ["TEST-BRK"]);
  // Reconciliation exposes an archive plan; the persistence adapter updates
  // status/deprecatedAt and intentionally has no delete operation.
  assert.equal("delete" in withoutBrick, false);
});

test("TEST fixture labels stay synthetic and never masquerade as GS1 data", () => {
  assert.ok(validRows.every((row) => row.sourceCode.startsWith("TEST-")));
  assert.equal(validRows.find((row) => row.level === "BRICK")?.description, "TEST ONLY");
});

test("internal node IDs are deterministic per source version and official code", () => {
  const first = gpcNodeId("2026-05", "TEST-BRK");
  assert.equal(first, gpcNodeId("2026-05", "TEST-BRK"));
  assert.notEqual(first, gpcNodeId("2026-11", "TEST-BRK"));
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("product classification lookup only accepts active Bricks in the active GS1 release or Wossol namespace", () => {
  const where = activeProductBrickWhere("test-id");
  assert.equal(where.id, "test-id");
  assert.equal(where.level, "BRICK");
  assert.equal(where.status, "ACTIVE");
  assert.deepEqual(where.OR, [
    { source: "WOSSOL_EXTENSION" },
    { source: "GS1_GPC", release: { is: { isActive: true, status: "ACTIVE" } } },
  ]);
  assert.equal("productFamilyId" in where, false);
});

test(
  "database import is repeatable, versioned, counts nodes, and preserves referenced history",
  { skip: !process.env.WOSSOL_EXPORT_DATABASE_URL },
  async () => {
    const prisma = getWossolExportPrisma();
    const marker = "ROLLBACK_C006A_TEST_FIXTURES";
    const existingExtensions = await prisma.catalogTaxonomyRelease.count({
      where: { source: "WOSSOL_EXTENSION" },
    });
    await assert.rejects(
      prisma.$transaction(async (tx) => {
        const runInsideTestTransaction: GpcTransactionRunner = (operation) => operation(tx);
        const versionOne = [
          ...validRows.map((row) => ({ ...row })),
          {
            sourceCode: "TEST-BRK-2",
            level: "BRICK" as const,
            name: "Second Synthetic Brick",
            parentCode: "TEST-CLS",
          },
        ];
        const frenchOne = versionOne.map((row) => ({ ...row, name: `FR ${row.name}` }));
        const bilingualOne = [
          { languageCode: "EN" as const, rows: versionOne },
          { languageCode: "FR" as const, rows: frenchOne },
        ];
        const first = await importGpcMultilingualRelease(
          "2099-01",
          bilingualOne,
          runInsideTestTransaction,
        );
        assert.deepEqual(first.counts, { segments: 1, families: 1, classes: 1, bricks: 2 });
        assert.equal(first.created, 5);
        assert.equal(first.translationCreated, 10);
        const localizedBrick = await tx.catalogTaxonomyNode.findUniqueOrThrow({
          where: {
            source_sourceCode_sourceVersion: {
              source: "GS1_GPC",
              sourceCode: "TEST-BRK",
              sourceVersion: "2099-01",
            },
          },
          select: {
            id: true,
            translations: {
              orderBy: { languageCode: "asc" },
              select: { languageCode: true, name: true, source: true },
            },
          },
        });
        assert.deepEqual(
          localizedBrick.translations.map(({ languageCode, name, source }) => ({
            languageCode,
            name,
            source,
          })),
          [
            { languageCode: "EN", name: "Synthetic Brick", source: "GS1_GPC" },
            { languageCode: "FR", name: "FR Synthetic Brick", source: "GS1_GPC" },
          ],
        );
        const repeated = await importGpcMultilingualRelease(
          "2099-01",
          bilingualOne,
          runInsideTestTransaction,
        );
        assert.equal(repeated.unchanged, 5);
        assert.equal(repeated.translationUnchanged, 10);
        assert.equal(repeated.created, 0);

        const company = await tx.company.create({
          data: { displayName: marker, slug: `${marker.toLowerCase()}-${Date.now()}` },
        });
        const originalBrick = await tx.catalogTaxonomyNode.findUniqueOrThrow({
          where: {
            source_sourceCode_sourceVersion: {
              source: "GS1_GPC",
              sourceCode: "TEST-BRK",
              sourceVersion: "2099-01",
            },
          },
        });
        const product = await tx.product.create({
          data: {
            companyId: company.id,
            taxonomyNodeId: originalBrick.id,
            name: marker,
            slug: `${marker.toLowerCase()}-product`,
          },
        });

        const versionTwo = versionOne.map((row) =>
          row.sourceCode === "TEST-BRK" ? { ...row, name: "Synthetic Brick v2" } : { ...row },
        );
        const frenchTwo = versionTwo.map((row) => ({ ...row, name: `FR ${row.name}` }));
        const next = await importGpcMultilingualRelease(
          "2099-02",
          [
            { languageCode: "EN", rows: versionTwo },
            { languageCode: "FR", rows: frenchTwo },
          ],
          runInsideTestTransaction,
        );
        assert.equal(next.created, 5);
        assert.equal(
          (await tx.product.findUniqueOrThrow({ where: { id: product.id } })).taxonomyNodeId,
          originalBrick.id,
        );
        assert.equal(
          await tx.catalogTaxonomyRelease.count({ where: { source: "GS1_GPC", isActive: true } }),
          1,
        );

        const versionOneWithoutBrick = versionOne.filter((row) => row.sourceCode !== "TEST-BRK");
        const versionOneWithoutBrickFr = versionOneWithoutBrick.map((row) => ({
          ...row,
          name: `FR ${row.name}`,
        }));
        const removedFromSource = await importGpcMultilingualRelease(
          "2099-01",
          [
            { languageCode: "EN", rows: versionOneWithoutBrick },
            { languageCode: "FR", rows: versionOneWithoutBrickFr },
          ],
          runInsideTestTransaction,
        );
        assert.equal(removedFromSource.deprecated, 1);
        const retainedBrick = await tx.catalogTaxonomyNode.findUniqueOrThrow({
          where: { id: originalBrick.id },
        });
        assert.equal(retainedBrick.status, "ARCHIVED");
        assert.equal(
          (await tx.product.findUniqueOrThrow({ where: { id: product.id } })).taxonomyNodeId,
          originalBrick.id,
        );
        assert.equal(
          await tx.catalogTaxonomyRelease.count({ where: { source: "WOSSOL_EXTENSION" } }),
          existingExtensions,
        );
        throw new Error(marker);
      }),
      new RegExp(marker),
    );
  },
);
