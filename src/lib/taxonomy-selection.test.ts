import assert from "node:assert/strict";
import test from "node:test";

import {
  beginTaxonomySelection,
  cancelTaxonomySelection,
  chooseTaxonomySelection,
  isTaxonomySelectionCurrent,
  saveTaxonomySelection,
} from "./taxonomy-selection.ts";

test("taxonomy selection marks the current Brick and a replacement as pending", () => {
  const saved = beginTaxonomySelection("brick-a");
  assert.equal(isTaxonomySelectionCurrent(saved.selectedId, "brick-a"), true);
  const replacement = chooseTaxonomySelection(saved, "brick-b");
  assert.equal(isTaxonomySelectionCurrent(replacement.selectedId, "brick-a"), false);
  assert.equal(isTaxonomySelectionCurrent(replacement.selectedId, "brick-b"), true);
  assert.equal(replacement.savedId, "brick-a");
});

test("taxonomy replacement persists only on save and cancellation retains saved selection", () => {
  const replacement = chooseTaxonomySelection(beginTaxonomySelection("brick-a"), "brick-b");
  assert.equal(cancelTaxonomySelection(replacement), "brick-a");
  assert.equal(saveTaxonomySelection(replacement), "brick-b");
  assert.equal(beginTaxonomySelection(saveTaxonomySelection(replacement)).selectedId, "brick-b");
});
