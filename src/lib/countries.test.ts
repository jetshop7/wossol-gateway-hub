import assert from "node:assert/strict";
import test from "node:test";

import { COUNTRIES, clientCountryLabel, countryLabel, searchCountries } from "./countries.ts";

test("country selector includes the complete ISO alpha-2 country set", () => {
  assert.equal(COUNTRIES.length, 249);
  assert.equal(new Set(COUNTRIES.map((country) => country.code)).size, 249);
  assert.ok(COUNTRIES.every((country) => /^[A-Z]{2}$/.test(country.code) && country.name));
});

test("country lookup searches by partial name, full name, and ISO code", () => {
  assert.ok(searchCountries("Al").some((country) => country.code === "DZ"));
  assert.deepEqual(
    searchCountries("Algeria").map((country) => country.code),
    ["DZ"],
  );
  assert.deepEqual(
    searchCountries("DZ").map((country) => country.code),
    ["DZ"],
  );
});

test("country presentation is readable and safely preserves unknown legacy values", () => {
  assert.equal(countryLabel("dz"), "Algeria (DZ)");
  assert.equal(clientCountryLabel("DZ"), "Algeria (DZ)");
  assert.equal(clientCountryLabel("Legacy origin"), "Legacy origin");
  assert.equal(clientCountryLabel("ZZ"), "ZZ");
  assert.equal(clientCountryLabel(null), "");
});
