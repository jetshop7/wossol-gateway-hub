import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  MAX_CATALOG_IMAGE_BYTES,
  catalogImageReference,
  getCatalogImageStorage,
  sniffCatalogImageMimeType,
  validateCatalogImage,
  variantOwnsCatalogImage,
} from "./catalog-image-storage.server.ts";
import { catalogImageReferenceSchema } from "./catalog.validation.ts";

const pngHeader = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("catalog image validation checks server-side content type and size", () => {
  assert.equal(sniffCatalogImageMimeType(pngHeader), "image/png");
  assert.equal(validateCatalogImage({ type: "image/png", size: pngHeader.length }, pngHeader), ".png");
  assert.throws(() => validateCatalogImage({ type: "image/png", size: pngHeader.length }, new Uint8Array([1, 2, 3])), /content does not match/);
  assert.throws(() => validateCatalogImage({ type: "image/svg+xml", size: 10 }), /Unsupported image type/);
  assert.throws(() => validateCatalogImage({ type: "image/png", size: MAX_CATALOG_IMAGE_BYTES + 1 }, pngHeader), /8 MB/);
});

test("local image storage writes generated IDs and loads/removes only validated images", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wossol-catalog-images-"));
  const previousRoot = process.env.WOSSOL_CATALOG_IMAGE_DIR;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.WOSSOL_CATALOG_IMAGE_DIR = root;
  process.env.NODE_ENV = "test";
  try {
    const storage = getCatalogImageStorage();
    const stored = await storage.store(new File([pngHeader], "photo.png", { type: "image/png" }));
    assert.match(stored.imageId, /^[0-9a-f-]{36}$/i);
    const loaded = await storage.load(stored.imageId);
    assert.equal(loaded?.mimeType, "image/png");
    assert.deepEqual(loaded?.bytes ? Array.from(loaded.bytes) : null, Array.from(pngHeader));
    assert.deepEqual(Array.from(await readFile(path.join(root, `${stored.imageId}.png`))), Array.from(pngHeader));
    await storage.remove(stored.imageId);
    assert.equal(await storage.load(stored.imageId), null);
  } finally {
    if (previousRoot === undefined) delete process.env.WOSSOL_CATALOG_IMAGE_DIR;
    else process.env.WOSSOL_CATALOG_IMAGE_DIR = previousRoot;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    await rm(root, { recursive: true, force: true });
  }
});

test("relative image references validate and image ownership is variant-scoped", () => {
  const imageA = "11111111-1111-4111-8111-111111111111";
  const imageB = "22222222-2222-4222-8222-222222222222";
  const refA = catalogImageReference(imageA);
  const refB = catalogImageReference(imageB);
  assert.equal(catalogImageReferenceSchema.parse(refA), refA);
  const variantA = { mainImageUrl: refA, additionalImageUrls: [refB] };
  assert.equal(variantOwnsCatalogImage(variantA, imageA, "main"), true);
  assert.equal(variantOwnsCatalogImage(variantA, imageB, "additional"), true);
  assert.equal(variantOwnsCatalogImage({ mainImageUrl: null, additionalImageUrls: [] }, imageA, "main"), false);
  assert.throws(() => catalogImageReference("../secret"), /Invalid image identifier/);
});

test("image storage refuses filesystem persistence in production without a durable adapter", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try { assert.throws(() => getCatalogImageStorage(), /Durable catalog image storage is not configured/); }
  finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
