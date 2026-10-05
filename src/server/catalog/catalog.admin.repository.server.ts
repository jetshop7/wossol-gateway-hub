import { getWossolExportPrisma } from "./prisma.server.ts";
import {
  catalogBrandInputSchema,
  catalogCompanyInputSchema,
  catalogCompanyUpdateInputSchema,
} from "./catalog.validation.ts";
import {
  toAdminBrandDto,
  toAdminCompanyDetailDto,
  toAdminCompanySummaryDto,
  type AdminBrandDto,
  type AdminCompanyDetailDto,
  type AdminCompanySummaryDto,
} from "./catalog.dto.ts";

const companySummarySelect = {
  id: true,
  displayName: true,
  legalName: true,
  slug: true,
  countryCode: true,
  website: true,
  status: true,
  updatedAt: true,
} as const;

const companyDetailSelect = {
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
  brands: {
    select: {
      id: true,
      companyId: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  },
} as const;

const brandSelect = {
  id: true,
  companyId: true,
  name: true,
  slug: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listAdminCompanies(): Promise<AdminCompanySummaryDto[]> {
  const records = await getWossolExportPrisma().company.findMany({
    select: companySummarySelect,
    orderBy: { displayName: "asc" },
  });
  return records.map(toAdminCompanySummaryDto);
}

export async function getAdminCompany(id: string): Promise<AdminCompanyDetailDto | null> {
  const record = await getWossolExportPrisma().company.findUnique({
    where: { id },
    select: companyDetailSelect,
  });
  return record ? toAdminCompanyDetailDto(record) : null;
}

export async function createAdminCompany(input: unknown): Promise<AdminCompanyDetailDto> {
  const data = catalogCompanyInputSchema.parse(input);
  const record = await getWossolExportPrisma().company.create({
    data: {
      ...data,
      legalName: data.legalName ?? null,
      countryCode: data.countryCode ?? null,
      website: data.website ?? null,
      internalNotes: data.internalNotes ?? null,
    },
    select: companyDetailSelect,
  });
  return toAdminCompanyDetailDto(record);
}

export async function updateAdminCompany(
  id: string,
  input: unknown,
): Promise<AdminCompanyDetailDto> {
  const data = catalogCompanyUpdateInputSchema.parse(input);
  const record = await getWossolExportPrisma().company.update({
    where: { id },
    data: {
      ...data,
      legalName: data.legalName ?? null,
      countryCode: data.countryCode ?? null,
      website: data.website ?? null,
      internalNotes: data.internalNotes ?? null,
    },
    select: companyDetailSelect,
  });
  return toAdminCompanyDetailDto(record);
}

export async function createAdminBrand(companyId: string, input: unknown): Promise<AdminBrandDto> {
  const data = catalogBrandInputSchema.parse(input);
  const record = await getWossolExportPrisma().brand.create({
    data: { companyId, ...data },
    select: brandSelect,
  });
  return toAdminBrandDto(record);
}

export async function updateAdminBrand(id: string, input: unknown): Promise<AdminBrandDto> {
  const data = catalogBrandInputSchema.parse(input);
  const record = await getWossolExportPrisma().brand.update({
    where: { id },
    data,
    select: brandSelect,
  });
  return toAdminBrandDto(record);
}
