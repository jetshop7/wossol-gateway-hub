import assert from "node:assert/strict";
import test from "node:test";

import { findProductByPublicReference } from "./client-catalog.repository.server.ts";

test("public reference lookup prefers an exact WOS-prefixed reference", async () => {
  const calls: string[] = [];
  const product = await findProductByPublicReference("WOS-ABC123", {
    async findExact(reference) {
      calls.push(`exact:${reference}`);
      return { id: "current-product" };
    },
    async findLegacy(reference) {
      calls.push(`legacy:${reference}`);
      return null;
    },
  });

  assert.deepEqual(product, { id: "current-product" });
  assert.deepEqual(calls, ["exact:WOS-ABC123"]);
});

test("WOS-prefixed reference resolves a case-insensitive legacy unprefixed value", async () => {
  const calls: string[] = [];
  const product = await findProductByPublicReference("WOS-ABC123", {
    async findExact(reference) {
      calls.push(`exact:${reference}`);
      return null;
    },
    async findLegacy(reference) {
      calls.push(`legacy-insensitive:${reference}`);
      return reference.toLowerCase() === "abc123" ? { id: "legacy-product" } : null;
    },
  });

  assert.deepEqual(product, { id: "legacy-product" });
  assert.deepEqual(calls, ["exact:WOS-ABC123", "legacy-insensitive:ABC123"]);
});

test("an unprefixed reference keeps exact-match behavior without broad fallback", async () => {
  const calls: string[] = [];
  const product = await findProductByPublicReference("ABC123", {
    async findExact(reference) {
      calls.push(`exact:${reference}`);
      return null;
    },
    async findLegacy(reference) {
      calls.push(`legacy:${reference}`);
      return null;
    },
  });

  assert.equal(product, null);
  assert.deepEqual(calls, ["exact:ABC123"]);
});
