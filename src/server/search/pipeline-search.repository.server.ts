import { searchCountries } from "../../lib/countries.ts";
import { getWossolExportPrisma } from "../catalog/prisma.server.ts";
import { toPipelineCompanySummary } from "./pipeline-search.dto.ts";

export type PipelineSearchInput = {
  query: string; country?: string; replyStatus?: string; lifecycleStatus?: string; commercialStatus?: string; attention?: string; emailOutreachStatus?: string; page: number; pageSize: number;
};

const listRelations = {
  companyCategories: { include: { category: { select: { displayName: true } } }, orderBy: { assignedAt: "desc" as const } },
  contactPoints: { select: { contactType: true, active: true, verificationStatus: true, sendAttempts: { select: { status: true } } } },
};
const companySelect = {
  companyId: true, legalName: true, tradeName: true, sector: true, countryCode: true, countryRaw: true, website: true, email: true, phone: true,
  commercialProgress: true, firstOutreachAt: true, lastContactAt: true, replyStatus: true, nextFollowUpAt: true, lifecycleStatus: true, currentAction: true,
  companyCategories: listRelations.companyCategories, contactPoints: listRelations.contactPoints,
} as const;

export async function searchPipelineCompanies(input: PipelineSearchInput) {
  const prisma = getWossolExportPrisma();
  const query = input.query.trim();
  const countryQuery = input.country?.trim() ?? "";
  const matchingCountries = countryQuery ? searchCountries(countryQuery) : [];
  const where = {
    ...(input.replyStatus ? { replyStatus: input.replyStatus } : {}), ...(input.lifecycleStatus ? { lifecycleStatus: input.lifecycleStatus } : {}),
    ...(input.commercialStatus ? { commercialProgress: input.commercialStatus } : {}),
    ...(input.attention === "FOLLOW_UP_DUE" ? { nextFollowUpAt: { not: null } } : {}), ...(input.attention === "REVIEW_COMPANY" ? { currentAction: "REVIEW_COMPANY" } : {}),
    ...(input.attention === "REVIEW_DATA" ? { currentAction: "REVIEW_DATA" } : {}), ...(input.attention === "CALL_BACK_REQUESTED" ? { currentAction: "CALL_BACK_REQUESTED" } : {}),
    ...(input.emailOutreachStatus === "SENT" ? { firstOutreachAt: { not: null } } : {}), ...(input.emailOutreachStatus === "NOT_SENT" ? { firstOutreachAt: null } : {}),
    ...(input.emailOutreachStatus === "FAILED" ? { sendAttempts: { some: { status: "FAILED" } } } : {}),
    ...(countryQuery ? { OR: [{ countryCode: { in: matchingCountries.map((country) => country.code) } }, { countryRaw: { contains: countryQuery, mode: "insensitive" as const } }] } : {}),
    ...(query ? { AND: [{ OR: [
      { companyId: { contains: query, mode: "insensitive" as const } }, { legalName: { contains: query, mode: "insensitive" as const } }, { tradeName: { contains: query, mode: "insensitive" as const } },
      { sector: { contains: query, mode: "insensitive" as const } }, { website: { contains: query, mode: "insensitive" as const } }, { email: { contains: query, mode: "insensitive" as const } }, { phone: { contains: query, mode: "insensitive" as const } },
    ] }] } : {}),
  };
  const skip = (input.page - 1) * input.pageSize;
  const [total, records] = await prisma.$transaction([
    prisma.pipelineCompany.count({ where }), prisma.pipelineCompany.findMany({ where, select: companySelect, orderBy: [{ updatedAt: "desc" }, { companyId: "asc" }], skip, take: input.pageSize }),
  ]);
  return { companies: records.map(toPipelineCompanySummary), page: input.page, pageSize: input.pageSize, total, totalPages: Math.ceil(total / input.pageSize) };
}

export async function getPipelineCompanyDetail(companyId: string) {
  const prisma = getWossolExportPrisma();
  const record = await prisma.pipelineCompany.findUnique({
    where: { companyId }, select: {
      ...companySelect, whatsapp: true, wilaya: true, city: true, address: true, contactPerson: true, department: true, discoverySource: true, sourceUrl: true, discoveryDate: true,
      qualificationStatus: true, duplicateStatus: true, duplicateReason: true, duplicateMatchCompanyIds: true, catalogReceived: true, pricesReceived: true, requiredInformationReceived: true, internalNotes: true, createdAt: true, updatedAt: true,
      contacts: { orderBy: { createdAt: "asc" } }, contactPoints: { orderBy: { updatedAt: "desc" }, include: { sources: { orderBy: { createdAt: "asc" } }, sendAttempts: { orderBy: { attemptAt: "desc" } } } },
      communications: { orderBy: [{ occurredAt: "desc" }, { communicationId: "desc" }] }, outreachDrafts: { orderBy: { updatedAt: "desc" }, include: { versions: { orderBy: { versionNumber: "desc" } }, sendPlans: { orderBy: { createdAt: "desc" }, include: { recipients: true } } } },
      sendAttempts: { orderBy: [{ attemptAt: "desc" }, { sendAttemptId: "desc" }] }, discoveryEvents: { orderBy: [{ discoveredAt: "desc" }, { eventId: "desc" }] }, auditEvents: { orderBy: [{ createdAt: "desc" }, { auditId: "desc" }] }, actions: { orderBy: { createdAt: "desc" } },
      companyCategories: { include: { category: true }, orderBy: { assignedAt: "desc" } }, classifications: { include: { category: true }, orderBy: { updatedAt: "desc" } },
    },
  });
  return record ? { ...record, summary: toPipelineCompanySummary(record) } : null;
}
