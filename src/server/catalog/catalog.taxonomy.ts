import type { Prisma } from "@prisma/client";

export function activeProductBrickWhere(id?: string): Prisma.CatalogTaxonomyNodeWhereInput {
  return {
    ...(id ? { id } : {}),
    level: "BRICK",
    status: "ACTIVE",
    OR: [
      { source: "WOSSOL_EXTENSION" },
      { source: "GS1_GPC", release: { is: { isActive: true, status: "ACTIVE" } } },
    ],
  };
}
