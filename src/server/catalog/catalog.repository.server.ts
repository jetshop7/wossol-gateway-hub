import { catalogCompanyInputSchema, validatePipelineCompanyLink } from "./catalog.validation.ts";
import { getWossolExportPrisma } from "./prisma.server.ts";
import { toAdminCompanyDto } from "./catalog.dto.ts";
import { type CatalogCompanyInput, type PipelineCompanyLinkInput } from "./catalog.contracts.ts";
import type { AdminCompanyDto } from "./catalog.dto.ts";

const adminCompanySelect = {
  id: true,
  displayName: true,
  legalName: true,
  slug: true,
  countryCode: true,
  website: true,
  status: true,
  internalNotes: true,
  createdAt: true,
  updatedAt: true,
  pipelineLinks: {
    select: {
      id: true,
      sourceSystem: true,
      sourceRecordId: true,
      companyId: true,
      linkageStatus: true,
      sourceUpdatedAt: true,
      reviewedAt: true,
      reviewedByRef: true,
      reviewNote: true,
    },
  },
} as const;

export async function createCompany(input: CatalogCompanyInput): Promise<AdminCompanyDto> {
  const data = catalogCompanyInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  const baseSlug =
    data.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "company";
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    try {
      const record = await prisma.company.create({
        data: {
          ...data,
          slug: suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`,
          status: "ACTIVE",
          internalNotes: data.internalNotes ?? null,
          legalName: data.legalName ?? null,
          countryCode: data.countryCode ?? null,
          website: data.website ?? null,
        },
        select: adminCompanySelect,
      });
      return toAdminCompanyDto(record);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002")
        continue;
      throw error;
    }
  }
  throw new Error("Unable to allocate a unique company slug.");
}

export async function findCompanyById(id: string): Promise<AdminCompanyDto | null> {
  const record = await getWossolExportPrisma().company.findUnique({
    where: { id },
    select: adminCompanySelect,
  });

  return record ? toAdminCompanyDto(record) : null;
}

/**
 * Records a proposal from the external Pipeline without changing catalog
 * publication or Company data. The compound unique key makes retries safe.
 */
export async function upsertPipelineCompanyLinkProposal(input: PipelineCompanyLinkInput) {
  const data = validatePipelineCompanyLink({
    ...input,
    linkageStatus: input.linkageStatus ?? "PROPOSED",
  });

  if (data.linkageStatus !== "PROPOSED") {
    throw new Error(
      "This repository primitive records Pipeline proposals only; linkage approval is a separate workflow.",
    );
  }

  return getWossolExportPrisma().companyPipelineLink.upsert({
    where: {
      sourceSystem_sourceRecordId: {
        sourceSystem: data.sourceSystem,
        sourceRecordId: data.sourceRecordId,
      },
    },
    create: {
      sourceSystem: data.sourceSystem,
      sourceRecordId: data.sourceRecordId,
      companyId: data.companyId ?? null,
      linkageStatus: data.linkageStatus,
      sourceUpdatedAt: data.sourceUpdatedAt ?? null,
      reviewedAt: data.reviewedAt ?? null,
      reviewedByRef: data.reviewedByRef ?? null,
      reviewNote: data.reviewNote ?? null,
    },
    update: {
      sourceUpdatedAt: data.sourceUpdatedAt ?? null,
    },
  });
}
