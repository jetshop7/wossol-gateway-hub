export type CatalogImageUploadResult = {
  ok: true;
  image: { imageId: string; reference: string; mimeType: string; size: number };
};

function isUploadResult(value: unknown): value is CatalogImageUploadResult {
  if (typeof value !== "object" || value === null || !("ok" in value) || value.ok !== true || !("image" in value)) return false;
  const image = value.image;
  return typeof image === "object" && image !== null && "imageId" in image && typeof image.imageId === "string" && "reference" in image && typeof image.reference === "string" && "mimeType" in image && typeof image.mimeType === "string" && "size" in image && typeof image.size === "number";
}

export async function readCatalogImageUploadResponse(response: Response): Promise<CatalogImageUploadResult> {
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new Error("Image upload did not reach the image service. Refresh the page and try again.");
  }
  let payload: unknown;
  try { payload = await response.json(); }
  catch { throw new Error("Image service returned an invalid response. Try again."); }
  if (!response.ok) {
    if (typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string") {
      const message = payload.error.trim();
      if (message.length > 0 && message.length <= 180 && !/<\s*!?(doctype|html|head|body|script)\b/i.test(message)) throw new Error(message);
    }
    throw new Error("Image upload failed. Please try again.");
  }
  if (!isUploadResult(payload)) throw new Error("Image service returned an invalid response. Try again.");
  return payload;
}
