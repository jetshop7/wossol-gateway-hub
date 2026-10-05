import { getWossolExportPrisma } from "./prisma.server.ts";
import {
  catalogBrandInputSchema,
  catalogCompanyInputSchema,
  catalogCompanyUpdateInputSchema,
  catalogProductFamilyInputSchema,
  catalogProductInputSchema,
} from "./catalog.validation.ts";
import { normalizeCatalogSlug } from "./catalog.contracts.ts";
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
  category: true,
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
  category: true,
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
      productFamilies: {
        select: {
          id: true,
          brandId: true,
          name: true,
          slug: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          products: {
            select: {
              id: true,
              productFamilyId: true,
              name: true,
              slug: true,
              shortDescription: true,
              description: true,
              internalNotes: true,
              publicationStatus: true,
              createdAt: true,
              updatedAt: true,
              variants: { select: { id: true, productId: true, sku: true, name: true, model: true, attributes: true, status: true, publicationStatus: true, createdAt: true, updatedAt: true } },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
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
  const prisma = getWossolExportPrisma();
  const baseSlug = normalizeCatalogSlug(data.displayName) || "company";
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    try {
      const record = await prisma.company.create({
        data: { ...data, slug, legalName: data.legalName ?? null, countryCode: data.countryCode ?? null, website: data.website ?? null, category: data.category ?? null, internalNotes: data.internalNotes ?? null },
        select: companyDetailSelect,
      });
      return toAdminCompanyDetailDto(record);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("Unable to allocate a unique company slug.");
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
      category: data.category ?? null,
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

function slugForName(name: string) {
  return normalizeCatalogSlug(name) || "record";
}

export async function createAdminProductFamily(companyId: string, brandId: string, input: unknown) {
  const data = catalogProductFamilyInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  const brand = await prisma.brand.findFirst({ where: { id: brandId, companyId } });
  if (!brand) throw new Error("The selected brand does not belong to this company.");
  const slug = slugForName(data.name);
  const record = await prisma.productFamily.create({ data: { brandId, ...data, slug }, select: { id: true, brandId: true, name: true, slug: true, description: true, status: true, createdAt: true, updatedAt: true } });
  return record;
}

export async function createAdminProduct(companyId: string, productFamilyId: string, input: unknown) {
  const data = catalogProductInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  const family = await prisma.productFamily.findFirst({ where: { id: productFamilyId, brand: { companyId } } });
  if (!family) throw new Error("The selected product family does not belong to this company.");
  const baseSlug = slugForName(data.name);
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const slug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    try {
      return await prisma.product.create({ data: { ...data, productFamilyId, slug }, select: { id: true, productFamilyId: true, name: true, slug: true, shortDescription: true, description: true, internalNotes: true, publicationStatus: true, createdAt: true, updatedAt: true, variants: { select: { id: true, productId: true, sku: true, name: true, model: true, attributes: true, status: true, publicationStatus: true, createdAt: true, updatedAt: true } } } });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("Unable to allocate a unique product slug.");
}

export async function updateAdminProduct(companyId: string, productId: string, input: unknown) {
  const data = catalogProductInputSchema.parse(input);
  const prisma = getWossolExportPrisma();
  const product = await prisma.product.findFirst({ where: { id: productId, productFamily: { brand: { companyId } } } });
  if (!product) throw new Error("The selected product does not belong to this company.");
  return prisma.product.update({ where: { id: productId }, data, select: { id: true, productFamilyId: true, name: true, slug: true, shortDescription: true, description: true, internalNotes: true, publicationStatus: true, createdAt: true, updatedAt: true, variants: { select: { id: true, productId: true, sku: true, name: true, model: true, attributes: true, status: true, publicationStatus: true, createdAt: true, updatedAt: true } } } });
}
