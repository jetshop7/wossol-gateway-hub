import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_CATALOG_IMAGE_BYTES = 8 * 1024 * 1024;
const acceptedTypes = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/avif", ".avif"]]);
export type CatalogImageMimeType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

export type StoredCatalogImage = { imageId: string; mimeType: string; size: number; bytes: Uint8Array };

export function catalogImageReference(imageId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(imageId)) throw new Error("Invalid image identifier.");
  return `/api/catalog-images?imageId=${imageId}`;
}

export function variantOwnsCatalogImage(variant: { mainImageUrl: string | null; additionalImageUrls: unknown }, imageId: string, slot: "main" | "additional") {
  const reference = catalogImageReference(imageId);
  if (slot === "main") return variant.mainImageUrl === reference;
  return Array.isArray(variant.additionalImageUrls) && variant.additionalImageUrls.some((entry) => entry === reference);
}

export function validateCatalogImage(file: { type: string; size: number }, bytes?: Uint8Array) {
  if (!acceptedTypes.has(file.type)) throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or AVIF.");
  if (file.size <= 0 || file.size > MAX_CATALOG_IMAGE_BYTES) throw new Error("Images must be between 1 byte and 8 MB.");
  if (bytes && sniffCatalogImageMimeType(bytes) !== file.type) throw new Error("The image content does not match its declared file type.");
  const extension = acceptedTypes.get(file.type);
  if (!extension) throw new Error("Unsupported image type.");
  return extension;
}

export function sniffCatalogImageMimeType(bytes: Uint8Array): CatalogImageMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" && ["avif", "avis"].includes(String.fromCharCode(...bytes.slice(8, 12)))) return "image/avif";
  return null;
}

function imageRoot() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Durable catalog image storage is not configured for production. Configure the approved object-storage adapter.");
  }
  return path.resolve(process.env.WOSSOL_CATALOG_IMAGE_DIR ?? ".local-catalog-images");
}

function safeImagePath(imageId: string, extension: string) {
  if (!/^[0-9a-f-]{36}$/i.test(imageId)) throw new Error("Invalid image identifier.");
  const root = imageRoot();
  const target = path.resolve(root, `${imageId}${extension}`);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Invalid image path.");
  return target;
}

async function storeLocalCatalogImage(file: File): Promise<{ imageId: string; mimeType: string; size: number }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = validateCatalogImage(file, bytes);
  const imageId = randomUUID();
  await mkdir(imageRoot(), { recursive: true });
  await writeFile(safeImagePath(imageId, extension), bytes, { flag: "wx" });
  return { imageId, mimeType: file.type, size: file.size };
}

async function loadLocalCatalogImage(imageId: string): Promise<StoredCatalogImage | null> {
  for (const [mimeType, extension] of acceptedTypes) {
    try { const bytes = await readFile(safeImagePath(imageId, extension)); return { imageId, mimeType, size: bytes.byteLength, bytes }; }
    catch (error) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") continue; throw error; }
  }
  return null;
}

async function removeLocalCatalogImage(imageId: string) {
  for (const extension of acceptedTypes.values()) {
    try { await rm(safeImagePath(imageId, extension)); return; }
    catch (error) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") continue; throw error; }
  }
}

export type CatalogImageStorage = {
  store(file: File): Promise<{ imageId: string; mimeType: string; size: number }>;
  load(imageId: string): Promise<StoredCatalogImage | null>;
  remove(imageId: string): Promise<void>;
};

const localDevelopmentStorage: CatalogImageStorage = {
  store: storeLocalCatalogImage,
  load: loadLocalCatalogImage,
  remove: removeLocalCatalogImage,
};

export function getCatalogImageStorage(): CatalogImageStorage {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Durable catalog image storage is not configured for production. Configure the approved object-storage adapter.");
  }
  return localDevelopmentStorage;
}

export async function storeCatalogImage(file: File) { return getCatalogImageStorage().store(file); }
export async function loadCatalogImage(imageId: string) { return getCatalogImageStorage().load(imageId); }
export async function removeCatalogImage(imageId: string) { return getCatalogImageStorage().remove(imageId); }
