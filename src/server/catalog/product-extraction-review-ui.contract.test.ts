import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(new URL("../../routes/admin/catalog/extraction-reviews.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../../lib/api/catalog-admin.functions.ts", import.meta.url), "utf8");
const admin = readFileSync(new URL("../../lib/admin.tsx", import.meta.url), "utf8");

test("Admin extraction review UI exposes the guarded review lifecycle", () => {
  assert.match(route, /createProductExtractionReviewFn/);
  assert.match(route, /requestProductExtractionCorrectionFn/);
  assert.match(route, /acceptProductExtractionReviewFn/);
  assert.match(route, /publishProductExtractionReviewFn/);
  assert.match(route, /Append-only history/);
  assert.match(route, /Accepted, not published/);
  assert.match(api, /catalog\.publish/);
  assert.match(admin, /\/admin\/catalog\/extraction-reviews/);
});
