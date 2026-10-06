import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

function isAuthorizationFailure(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error.code === "FORBIDDEN" || error.code === "CSRF_REQUIRED" || error.code === "AUTHENTICATION_FAILED");
}

export const Route = createFileRoute("/api/catalog-images")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const imageId = new URL(request.url).searchParams.get("imageId");
          if (!imageId) return new Response("Not found", { status: 404 });
          const [{ loadCatalogImage, catalogImageReference }, { getWossolExportPrisma }, { resolveAuthenticatedActor, requireCatalogCapability }] = await Promise.all([
            import("@/server/catalog/catalog-image-storage.server"),
            import("@/server/catalog/prisma.server"),
            import("@/server/auth/auth.context.server"),
          ]);
          const actor = await resolveAuthenticatedActor();
          const imageRef = catalogImageReference(imageId);
          const publicVariant = await getWossolExportPrisma().variant.findFirst({ where: { status: "ACTIVE", publicationStatus: "PUBLISHED", product: { publicationStatus: "PUBLISHED" }, OR: [{ mainImageUrl: imageRef }, { additionalImageUrls: { array_contains: [imageRef] } }] }, select: { id: true } });
          if (!publicVariant && actor?.actorType !== "INTERNAL") return new Response("Not found", { status: 404 });
          if (actor?.actorType === "INTERNAL") await requireCatalogCapability("catalog.read_internal");
          const image = await loadCatalogImage(imageId);
          if (!image) return new Response("Not found", { status: 404 });
          const body = new ArrayBuffer(image.bytes.byteLength);
          new Uint8Array(body).set(image.bytes);
          return new Response(body, { headers: { "Content-Type": image.mimeType, "Cache-Control": publicVariant ? "public, max-age=31536000, immutable" : "private, no-store", "X-Content-Type-Options": "nosniff" } });
        } catch { return new Response("Image storage unavailable", { status: 404 }); }
      },
      POST: async ({ request }) => {
        try {
          const [{ requireCatalogCapability, requireMutationCsrf }, { getWossolExportPrisma }, { storeCatalogImage, catalogImageReference }] = await Promise.all([
            import("@/server/auth/auth.context.server"),
            import("@/server/catalog/prisma.server"),
            import("@/server/catalog/catalog-image-storage.server"),
          ]);
          requireMutationCsrf(); await requireCatalogCapability("catalog.product.manage");
          const form = await request.formData();
          const variantId = String(form.get("variantId") ?? "");
          const slot = String(form.get("slot") ?? "");
          const file = form.get("file");
          if (!/^[0-9a-f-]{36}$/i.test(variantId) || !(file instanceof File) || !["main", "additional"].includes(slot)) return new Response("Invalid upload request", { status: 400 });
          const prisma = getWossolExportPrisma();
          const variant = await prisma.variant.findUnique({ where: { id: variantId }, select: { id: true, mainImageUrl: true, additionalImageUrls: true } });
          if (!variant) return new Response("Variant not found", { status: 404 });
          const stored = await storeCatalogImage(file);
          const reference = catalogImageReference(stored.imageId);
          const existing = Array.isArray(variant.additionalImageUrls) ? variant.additionalImageUrls.filter((entry): entry is string => typeof entry === "string") : [];
          await prisma.variant.update({ where: { id: variantId }, data: slot === "main" ? { mainImageUrl: reference } : { additionalImageUrls: [...existing, reference] } });
          const previousId = slot === "main" && variant.mainImageUrl ? /^\/api\/catalog-images\?imageId=([0-9a-f-]{36})$/i.exec(variant.mainImageUrl)?.[1] : undefined;
          if (previousId && previousId !== stored.imageId) {
            const previousReference = catalogImageReference(previousId);
            const stillReferenced = await prisma.variant.findFirst({ where: { OR: [{ mainImageUrl: previousReference }, { additionalImageUrls: { array_contains: [previousReference] } }] }, select: { id: true } });
            if (!stillReferenced) {
              try { const { removeCatalogImage } = await import("@/server/catalog/catalog-image-storage.server"); await removeCatalogImage(previousId); }
              catch (error) { console.warn("Replaced catalog image could not be cleaned up.", error); }
            }
          }
          return Response.json({ ok: true, image: { imageId: stored.imageId, reference, mimeType: stored.mimeType, size: stored.size } });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed";
          const status = isAuthorizationFailure(error) ? 403 : message.includes("Unsupported") || message.includes("8 MB") || message.includes("content does not match") ? 415 : 500;
          return new Response(status === 403 ? "Forbidden" : status === 415 ? message : "Image upload failed", { status });
        }
      },
      DELETE: async ({ request }) => {
        try {
          const [{ requireCatalogCapability, requireMutationCsrf }, { getWossolExportPrisma }, { removeCatalogImage, catalogImageReference, variantOwnsCatalogImage }] = await Promise.all([
            import("@/server/auth/auth.context.server"),
            import("@/server/catalog/prisma.server"),
            import("@/server/catalog/catalog-image-storage.server"),
          ]);
          requireMutationCsrf(); await requireCatalogCapability("catalog.product.manage");
          const payload: unknown = await request.json();
          if (typeof payload !== "object" || payload === null || !("variantId" in payload) || !("imageId" in payload) || !("slot" in payload)) return new Response("Invalid image reference", { status: 400 });
          const { variantId, imageId, slot } = payload;
          if (typeof variantId !== "string" || typeof imageId !== "string" || (slot !== "main" && slot !== "additional") || !/^[0-9a-f-]{36}$/i.test(variantId) || !/^[0-9a-f-]{36}$/i.test(imageId)) return new Response("Invalid image reference", { status: 400 });
          const prisma = getWossolExportPrisma();
          const variant = await prisma.variant.findUnique({ where: { id: variantId }, select: { mainImageUrl: true, additionalImageUrls: true } });
          if (!variant) return new Response("Variant not found", { status: 404 });
          const reference = catalogImageReference(imageId);
          if (slot === "main") {
            if (!variantOwnsCatalogImage(variant, imageId, slot)) return new Response("Image is not owned by this variant", { status: 403 });
            await prisma.variant.update({ where: { id: variantId }, data: { mainImageUrl: null } });
          } else {
            const entries = Array.isArray(variant.additionalImageUrls) ? variant.additionalImageUrls.filter((entry): entry is string => typeof entry === "string") : [];
            if (!variantOwnsCatalogImage(variant, imageId, slot)) return new Response("Image is not owned by this variant", { status: 403 });
            await prisma.variant.update({ where: { id: variantId }, data: { additionalImageUrls: entries.filter((entry) => entry !== reference) } });
          }
          const stillReferenced = await prisma.variant.findFirst({ where: { OR: [{ mainImageUrl: reference }, { additionalImageUrls: { array_contains: [reference] } }] }, select: { id: true } });
          if (!stillReferenced) await removeCatalogImage(imageId);
          return Response.json({ ok: true });
        } catch (error) {
          const status = isAuthorizationFailure(error) ? 403 : 500;
          return new Response(status === 403 ? "Forbidden" : "Image removal failed", { status });
        }
      },
    },
  },
});
