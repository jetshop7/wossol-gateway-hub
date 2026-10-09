import assert from "node:assert/strict";
import test from "node:test";

import {
  canPublishExtraction,
  isClientVisibleExtractionState,
  publicationStatusForExtractionState,
} from "./product-extraction-workflow.ts";

test("open extraction reviews map only to the existing non-public review status", () => {
  assert.equal(publicationStatusForExtractionState("UNDER_REVIEW"), "IN_REVIEW");
  assert.equal(publicationStatusForExtractionState("REQUIRES_CORRECTION"), "IN_REVIEW");
  assert.equal(isClientVisibleExtractionState("UNDER_REVIEW"), false);
});

test("accepted remains separate from catalog publication status", () => {
  assert.throws(() => publicationStatusForExtractionState("ACCEPTED"), /not a catalog publication status/);
  assert.equal(isClientVisibleExtractionState("ACCEPTED"), false);
});

test("only published extraction is client-visible and only Catalog Admin may publish", () => {
  assert.equal(publicationStatusForExtractionState("PUBLISHED"), "PUBLISHED");
  assert.equal(isClientVisibleExtractionState("PUBLISHED"), true);
  assert.equal(canPublishExtraction("CATALOG_ADMIN"), true);
  assert.equal(canPublishExtraction("CATALOG_EDITOR"), false);
  assert.equal(canPublishExtraction(undefined), false);
});
