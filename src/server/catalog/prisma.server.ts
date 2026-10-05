import { PrismaClient } from "@prisma/client";

const globalForWossolExportPrisma = globalThis as unknown as {
  wossolExportPrisma?: PrismaClient;
};

let productionPrisma: PrismaClient | undefined;

/**
 * Wossol Export's database client boundary.
 *
 * This module is server-only by suffix and reads the dedicated
 * WOSSOL_EXPORT_DATABASE_URL at request/runtime use. It deliberately does not
 * read the platform repository's DATABASE_URL.
 */
export function getWossolExportPrisma(): PrismaClient {
  if (!process.env.WOSSOL_EXPORT_DATABASE_URL) {
    throw new Error("WOSSOL_EXPORT_DATABASE_URL is required for catalog persistence.");
  }

  if (process.env.NODE_ENV !== "production") {
    globalForWossolExportPrisma.wossolExportPrisma ??= new PrismaClient();
    return globalForWossolExportPrisma.wossolExportPrisma;
  }

  productionPrisma ??= new PrismaClient();
  return productionPrisma;
}
