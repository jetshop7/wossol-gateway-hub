import { catalogImageReference, storeCatalogImage } from "./catalog-image-storage.server.ts";

type UploadVariant = { id: string; mainImageUrl: string | null; additionalImageUrls: unknown };
export type CatalogImageUploadServices = {
  requireCsrf(): void | Promise<void>;
  requireProductManage(): Promise<void>;
  findVariant(variantId: string): Promise<UploadVariant | null>;
  store(file: File): Promise<{ imageId: string; mimeType: string; size: number }>;
  updateImages(variantId: string, update: { mainImageUrl?: string; additionalImageUrls?: string[] }): Promise<void>;
  isReferenced(reference: string): Promise<boolean>;
  remove(imageId: string): Promise<void>;
};

function jsonError(status: number, error: string) {
  return Response.json({ ok: false, error }, { status });
}

async function productionServices(): Promise<CatalogImageUploadServices> {
  const [{ requireCatalogCapability, requireMutationCsrf }, { getWossolExportPrisma }] = await Promise.all([
    import("@/server/auth/auth.context.server"),
    import("@/server/catalog/prisma.server"),
  ]);
  const prisma = getWossolExportPrisma();
  return {
    requireCsrf: requireMutationCsrf,
    requireProductManage: () => requireCatalogCapability("catalog.product.manage").then(() => undefined),
    findVariant: (variantId) => prisma.variant.findUnique({ where: { id: variantId }, select: { id: true, mainImageUrl: true, additionalImageUrls: true } }),
    store: storeCatalogImage,
    updateImages: async (variantId, update) => { await prisma.variant.update({ where: { id: variantId }, data: update }); },
    isReferenced: async (reference) => Boolean(await prisma.variant.findFirst({ where: { OR: [{ mainImageUrl: reference }, { additionalImageUrls: { array_contains: [reference] } }] }, select: { id: true } })),
    remove: async (imageId) => { const { removeCatalogImage } = await import("./catalog-image-storage.server.ts"); await removeCatalogImage(imageId); },
  };
}

function errorResponse(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
  if (code === "AUTHENTICATION_FAILED") return jsonError(401, "Sign in is required to upload images.");
  if (code === "FORBIDDEN" || code === "CSRF_REQUIRED") return jsonError(403, "You are not authorized to upload this image.");
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Unsupported") || message.includes("8 MB") || message.includes("content does not match")) return jsonError(415, message);
  console.error("Catalog image upload failed.", error);
  return jsonError(500, "Image upload failed. Please try again.");
}

export async function handleCatalogImageUpload(request: Request, injectedServices?: CatalogImageUploadServices): Promise<Response> {
  try {
    const services = injectedServices ?? await productionServices();
    await services.requireCsrf();
    await services.requireProductManage();
    const form = await request.formData();
    const variantId = String(form.get("variantId") ?? "");
    const slot = String(form.get("slot") ?? "");
    const file = form.get("file");
    if (!/^[0-9a-f-]{36}$/i.test(variantId) || !(file instanceof File) || (slot !== "main" && slot !== "additional")) {
      return jsonError(400, "Choose an image and a valid variant.");
    }
    const variant = await services.findVariant(variantId);
    if (!variant) return jsonError(404, "Variant not found.");

    const stored = await services.store(file);
    const reference = catalogImageReference(stored.imageId);
    const additional = Array.isArray(variant.additionalImageUrls) ? variant.additionalImageUrls.filter((entry): entry is string => typeof entry === "string") : [];
    await services.updateImages(variantId, slot === "main" ? { mainImageUrl: reference } : { additionalImageUrls: [...additional, reference] });

    const previousId = slot === "main" && variant.mainImageUrl ? /^\/api\/catalog-images\?imageId=([0-9a-f-]{36})$/i.exec(variant.mainImageUrl)?.[1] : undefined;
    if (previousId && previousId !== stored.imageId) {
      const previousReference = catalogImageReference(previousId);
      if (!await services.isReferenced(previousReference)) {
        try { await services.remove(previousId); }
        catch (cleanupError) { console.warn("Replaced catalog image could not be cleaned up.", cleanupError); }
      }
    }

    return Response.json({ ok: true, image: { imageId: stored.imageId, reference, mimeType: stored.mimeType, size: stored.size } });
  } catch (error) {
    return errorResponse(error);
  }
}
