import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const schemaUrl = new URL("../../../prisma/schema.prisma", import.meta.url);
const migrationUrl = new URL(
  "../../../prisma/migrations/20261008120000_pipeline_search_foundation_review/migration.sql",
  import.meta.url,
);

const [schema, migration] = await Promise.all([
  readFile(schemaUrl, "utf8"),
  readFile(migrationUrl, "utf8"),
]);

const pipelineSchema = schema.slice(
  schema.indexOf("model PipelineCompany"),
  schema.indexOf("model Company"),
);
const tableSql = (name: string) => {
  const start = migration.indexOf(`CREATE TABLE "${name}"`);
  const end = migration.indexOf(");", start) + 2;
  assert.ok(start >= 0 && end > start, `missing SQL table ${name}`);
  return migration.slice(start, end);
};
const modelBlock = (name: string) => {
  const start = schema.indexOf(`model ${name} {`);
  const end = schema.indexOf("\nmodel ", start + 1);
  assert.ok(start >= 0 && end > start, `missing Prisma model ${name}`);
  return schema.slice(start, end);
};

const tableNames = [
  "actions",
  "categories",
  "communications",
  "companies",
  "company_audit_events",
  "company_categories",
  "company_classifications",
  "contact_point_sources",
  "contact_points",
  "contacts",
  "countries",
  "discovery_candidate_categories",
  "discovery_candidate_contacts",
  "discovery_candidate_events",
  "discovery_candidates",
  "discovery_events",
  "discovery_run_results",
  "discovery_runs",
  "outreach_draft_versions",
  "outreach_drafts",
  "send_attempts",
  "send_plan_recipients",
  "send_plans",
];

const modelByTable = new Map([
  ["actions", "PipelineAction"],
  ["categories", "PipelineCategory"],
  ["communications", "PipelineCommunication"],
  ["companies", "PipelineCompany"],
  ["company_audit_events", "PipelineCompanyAuditEvent"],
  ["company_categories", "PipelineCompanyCategory"],
  ["company_classifications", "PipelineCompanyClassification"],
  ["contact_point_sources", "PipelineContactPointSource"],
  ["contact_points", "PipelineContactPoint"],
  ["contacts", "PipelineContact"],
  ["countries", "PipelineCountry"],
  ["discovery_candidate_categories", "PipelineDiscoveryCandidateCategory"],
  ["discovery_candidate_contacts", "PipelineDiscoveryCandidateContact"],
  ["discovery_candidate_events", "PipelineDiscoveryCandidateEvent"],
  ["discovery_candidates", "PipelineDiscoveryCandidate"],
  ["discovery_events", "PipelineDiscoveryEvent"],
  ["discovery_run_results", "PipelineDiscoveryRunResult"],
  ["discovery_runs", "PipelineDiscoveryRun"],
  ["outreach_draft_versions", "PipelineOutreachDraftVersion"],
  ["outreach_drafts", "PipelineOutreachDraft"],
  ["send_attempts", "PipelineSendAttempt"],
  ["send_plan_recipients", "PipelineSendPlanRecipient"],
  ["send_plans", "PipelineSendPlan"],
]);

test("maps every Pipeline table to an additive pipeline_ Prisma model and table", () => {
  assert.equal(tableNames.length, 23);
  for (const tableName of tableNames) {
    const modelName = modelByTable.get(tableName);
    assert.ok(modelName);
    assert.match(pipelineSchema, new RegExp(`model ${modelName}\\s`));
    assert.ok(pipelineSchema.includes(`@@map("pipeline_${tableName}")`));
    assert.ok(migration.includes(`CREATE TABLE "pipeline_${tableName}"`));
  }
});

test("preserves TEXT evidence/timestamps and does not introduce JSON or DateTime coercion", () => {
  assert.doesNotMatch(pipelineSchema, /\\b(Json|DateTime)\\b/);
  for (const field of [
    "rawSnapshot",
    "matchEvidence",
    "arabicTranslation",
    "createdAt",
    "updatedAt",
  ]) {
    assert.ok(pipelineSchema.includes(field));
  }
});

test("retains idempotency keys, composite keys, and safe historical foreign keys", () => {
  assert.doesNotMatch(pipelineSchema, /onDelete:\s*Cascade/);
  assert.doesNotMatch(migration, /ON DELETE CASCADE/);
  for (const fragment of [
    "@unique",
    "@@id([candidateId, categoryCode])",
    "@@id([companyId, categoryCode])",
    "@@unique([companyId, categoryCode]",
    "@@unique([draftId, versionNumber]",
    "@@unique([sendPlanId, contactPointId]",
    "onDelete: Restrict",
  ]) {
    assert.ok(pipelineSchema.includes(fragment));
  }
  for (const fragment of [
    '"fingerprint" TEXT NOT NULL UNIQUE',
    'PRIMARY KEY ("candidate_id", "category_code")',
    'UNIQUE ("company_id", "category_code")',
    "ON DELETE RESTRICT",
  ]) {
    assert.ok(migration.replace(/\s+/g, "").includes(fragment.replace(/\s+/g, "")));
  }
});

test("does not invent foreign keys for semantic references without source constraints", () => {
  assert.match(pipelineSchema, /contactPointId\s+String\?\s+@map\("contact_point_id"\)/);
  assert.match(pipelineSchema, /eventId\s+String\?\s+@map\("event_id"\)/);
  assert.match(pipelineSchema, /companyId\s+String\?\s+@map\("company_id"\)/);
  assert.doesNotMatch(modelBlock("PipelineCommunication"), /@relation\(fields: \[contactPointId\]/);
  assert.doesNotMatch(tableSql("pipeline_communications"), /FOREIGN KEY \("contact_point_id"\)/i);
  assert.doesNotMatch(tableSql("pipeline_discovery_run_results"), /FOREIGN KEY \("event_id"\)/i);
  assert.doesNotMatch(tableSql("pipeline_discovery_run_results"), /FOREIGN KEY \("company_id"\)/i);
});

test("keeps Pipeline identity separate from catalog Company and Client visibility", () => {
  assert.doesNotMatch(pipelineSchema, /@relation\([^\n]*catalog|@relation\([^\n]*Company/);
  assert.doesNotMatch(pipelineSchema, /ClientAccount|ClientUser|ClientCatalog/);
  assert.match(schema, /model CompanyPipelineLink/);
  assert.match(schema, /sourceSystem.*@map\("source_system"\)/);
  assert.match(schema, /linkageStatus.*@default\(PROPOSED\)/);
});

test("keeps the foundation feature-disabled and non-transporting", async () => {
  const routeFiles = await import("node:fs/promises").then(({ readdir }) =>
    readdir(new URL("../../routes", import.meta.url), { recursive: true }),
  );
  assert.doesNotMatch(migration, /(^|\n)\s*(INSERT|DELETE|COPY|ALTER)\s+/im);
  assert.equal(
    routeFiles.some((file) => String(file).toLowerCase().includes("pipeline")),
    false,
  );
  assert.doesNotMatch(pipelineSchema, /smtp|sendmail|nodemailer|brevo/i);
});
