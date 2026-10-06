import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { readCatalogImageUploadResponse } from "../../lib/catalog-image-upload-response.ts";
import { getCatalogImageStorage, validateCatalogImage } from "./catalog-image-storage.server.ts";
import { handleCatalogImageUpload, type CatalogImageUploadServices } from "./catalog-image-upload.server.ts";

const variantId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function requestFor(file: File) {
  const form = new FormData();
  form.set("variantId", variantId);
  form.set("slot", "main");
  form.set("file", file);
  return new Request("http://localhost/api/catalog-images", { method: "POST", body: form });
}

function services(overrides: Partial<CatalogImageUploadServices> = {}): CatalogImageUploadServices {
  return {
    requireCsrf: () => undefined,
    requireProductManage: async () => undefined,
    findVariant: async (id) => ({ id, mainImageUrl: null, additionalImageUrls: [] }),
    store: async (file) => { validateCatalogImage(file, new Uint8Array(await file.arrayBuffer())); return { imageId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", mimeType: file.type, size: file.size }; },
    updateImages: async () => undefined,
    isReferenced: async () => false,
    remove: async () => undefined,
    ...overrides,
  };
}

test("authorized Admin upload handler stores a local image and returns structured API metadata", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wossol-upload-route-"));
  const previousRoot = process.env.WOSSOL_CATALOG_IMAGE_DIR;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.WOSSOL_CATALOG_IMAGE_DIR = root;
  process.env.NODE_ENV = "test";
  try {
    const storage = getCatalogImageStorage();
    let attachedReference: string | undefined;
    let csrfValidated = false;
    let manageCapabilityValidated = false;
    const response = await handleCatalogImageUpload(requestFor(new File([png], "catalog.png", { type: "image/png" })), services({
      requireCsrf: () => { csrfValidated = true; },
      requireProductManage: async () => { manageCapabilityValidated = true; },
      store: storage.store,
      updateImages: async (_id, update) => { attachedReference = update.mainImageUrl; },
    }));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
    const result = await readCatalogImageUploadResponse(response);
    assert.equal(result.image.mimeType, "image/png");
    assert.equal(result.image.size, png.length);
    assert.equal(result.image.reference, `/api/catalog-images?imageId=${result.image.imageId}`);
    assert.equal(attachedReference, result.image.reference);
    assert.equal(csrfValidated, true);
    assert.equal(manageCapabilityValidated, true);
    assert.deepEqual(Array.from((await storage.load(result.image.imageId))!.bytes), Array.from(png));
  } finally {
    if (previousRoot === undefined) delete process.env.WOSSOL_CATALOG_IMAGE_DIR;
    else process.env.WOSSOL_CATALOG_IMAGE_DIR = previousRoot;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    await rm(root, { recursive: true, force: true });
  }
});

test("unsupported and oversized uploads return short structured errors", async () => {
  const rejectUnsupported = await handleCatalogImageUpload(requestFor(new File(["<svg/>"] , "vector.svg", { type: "image/svg+xml" })), services());
  assert.equal(rejectUnsupported.status, 415);
  assert.match(rejectUnsupported.headers.get("content-type") ?? "", /application\/json/);
  assert.match((await rejectUnsupported.json()).error, /Unsupported image type/);

  const tooLarge = new Uint8Array(8 * 1024 * 1024 + 1);
  const rejectOversized = await handleCatalogImageUpload(requestFor(new File([tooLarge], "large.png", { type: "image/png" })), services());
  assert.equal(rejectOversized.status, 415);
  assert.match(rejectOversized.headers.get("content-type") ?? "", /application\/json/);
  assert.match((await rejectOversized.json()).error, /8 MB/);
});

test("upload route preserves CSRF and authentication/authorization rejection", async () => {
  const missingCsrf = await handleCatalogImageUpload(requestFor(new File([png], "x.png", { type: "image/png" })), services({
    requireCsrf: () => { throw Object.assign(new Error("CSRF"), { code: "CSRF_REQUIRED" }); },
  }));
  assert.equal(missingCsrf.status, 403);
  assert.deepEqual(await missingCsrf.json(), { ok: false, error: "You are not authorized to upload this image." });

  const unauthorized = await handleCatalogImageUpload(requestFor(new File([png], "x.png", { type: "image/png" })), services({
    requireProductManage: async () => { throw Object.assign(new Error("No session"), { code: "AUTHENTICATION_FAILED" }); },
  }));
  assert.equal(unauthorized.status, 401);
  assert.deepEqual(await unauthorized.json(), { ok: false, error: "Sign in is required to upload images." });

  const forbidden = await handleCatalogImageUpload(requestFor(new File([png], "x.png", { type: "image/png" })), services({
    requireProductManage: async () => { throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" }); },
  }));
  assert.equal(forbidden.status, 403);
});

test("frontend upload response parser never returns raw HTML response content", async () => {
  const html = "<!doctype html><html><body>complete app source must not be shown</body></html>";
  await assert.rejects(
    readCatalogImageUploadResponse(new Response(html, { status: 404, headers: { "content-type": "text/html" } })),
    (error: Error) => error.message.length < 100 && !error.message.includes("<!doctype") && !error.message.includes("complete app source"),
  );
  await assert.rejects(
    readCatalogImageUploadResponse(Response.json({ ok: false, error: "Image type rejected." }, { status: 415 })),
    /Image type rejected/,
  );
  await assert.rejects(
    readCatalogImageUploadResponse(Response.json({ ok: false, error: "<html>hidden response</html>" }, { status: 500 })),
    (error: Error) => error.message.length < 100 && !error.message.includes("<html>"),
  );
});
