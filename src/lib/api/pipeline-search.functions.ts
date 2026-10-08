import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const searchInput = z.object({ query: z.string().trim().max(120).default(""), country: z.string().trim().max(80).optional(), replyStatus: z.string().trim().max(40).optional(), lifecycleStatus: z.string().trim().max(40).optional(), commercialStatus: z.string().trim().max(60).optional(), attention: z.string().trim().max(40).optional(), emailOutreachStatus: z.string().trim().max(40).optional(), page: z.number().int().min(1).max(10_000).default(1), pageSize: z.number().int().min(1).max(100).default(25) });

async function requireSearchAdmin() {
  const { requireCatalogCapability } = await import("../../server/auth/auth.context.server.ts");
  return requireCatalogCapability("catalog.read_internal");
}

export const searchAdminPipelineCompaniesFn = createServerFn({ method: "GET" }).inputValidator(searchInput).handler(async ({ data }) => {
  await requireSearchAdmin();
  const { searchPipelineCompanies } = await import("../../server/search/pipeline-search.repository.server.ts");
  return { ok: true as const, ...(await searchPipelineCompanies(data)) };
});

export const getAdminPipelineCompanyFn = createServerFn({ method: "GET" }).inputValidator(z.object({ companyId: z.string().trim().min(1).max(120) })).handler(async ({ data }) => {
  await requireSearchAdmin();
  const { getPipelineCompanyDetail } = await import("../../server/search/pipeline-search.repository.server.ts");
  const company = await getPipelineCompanyDetail(data.companyId);
  return company ? { ok: true as const, company } : { ok: false as const, error: "Pipeline company not found." };
});
