import assert from "node:assert/strict";
import test from "node:test";

import {
  createLatestRequestGate,
  directoryFilterDelay,
} from "./admin-product-directory-requests.ts";

const base = {
  query: "",
  companyId: "",
  taxonomyNodeId: "",
  countryOfOrigin: "",
  publicationStatus: "",
};

test("directory text input is debounced while discrete filters update immediately", () => {
  assert.equal(directoryFilterDelay(base, { ...base, query: "rice" }), 250);
  assert.equal(directoryFilterDelay(base, { ...base, countryOfOrigin: "DZ" }), 250);
  assert.equal(directoryFilterDelay(base, { ...base, companyId: "company-1" }), 0);
  assert.equal(directoryFilterDelay(base, { ...base, taxonomyNodeId: "brick-1" }), 0);
  assert.equal(directoryFilterDelay(base, { ...base, publicationStatus: "PUBLISHED" }), 0);
});

test("only the most recent directory request may update the page", () => {
  const gate = createLatestRequestGate();
  const first = gate.begin();
  const second = gate.begin();
  assert.equal(gate.isCurrent(first), false);
  assert.equal(gate.isCurrent(second), true);
  gate.invalidate();
  assert.equal(gate.isCurrent(second), false);
});
