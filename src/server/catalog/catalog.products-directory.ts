import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const adminProductDirectoryInputSchema = z.object({
  query: z.string().trim().max(120).default(""),
  companyId: z.string().uuid().optional(),
  taxonomyNodeId: z.string().uuid().optional(),
  countryOfOrigin: z.string().trim().length(2).toUpperCase().optional(),
  publicationStatus: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
  page: z.number().int().min(0).max(100_000).default(0),
  pageSize: z.number().int().min(1).max(50).default(25),
});

export type AdminProductDirectoryInput = z.infer<typeof adminProductDirectoryInputSchema>;

export function buildAdminProductDirectoryWhere(
  input: AdminProductDirectoryInput,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (input.query) {
    where.OR = [
      { name: { contains: input.query, mode: "insensitive" } },
      { publicReference: { contains: input.query, mode: "insensitive" } },
    ];
  }
  if (input.companyId) where.companyId = input.companyId;
  if (input.taxonomyNodeId) where.taxonomyNodeId = input.taxonomyNodeId;
  if (input.countryOfOrigin) where.countryOfOrigin = input.countryOfOrigin;
  if (input.publicationStatus) where.publicationStatus = input.publicationStatus;
  return where;
}
