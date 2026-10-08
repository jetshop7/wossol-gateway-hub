type MaybeString = string | null;

export { safeWebsiteHref } from "../../lib/pipeline-search.ts";

export type PipelineCompanySummary = {
  companyId: string; name: string; legalName: MaybeString; sector: MaybeString; category: MaybeString; countryCode: MaybeString; countryRaw: MaybeString;
  website: MaybeString; email: MaybeString; phone: MaybeString; contactStatus: string; emailOutreachStatus: string; phoneStatus: string; whatsappStatus: string;
  commercialStatus: string; attention: string; replyStatus: string; lastContactAt: MaybeString; nextFollowUpAt: MaybeString; currentAction: string; lifecycleStatus: string;
};

export function pipelineCompanyName(record: { companyId: string; legalName: MaybeString; tradeName: MaybeString }) { return record.tradeName?.trim() || record.legalName?.trim() || record.companyId; }
export function pipelineContactStatus(record: { commercialProgress: string; firstOutreachAt: MaybeString; lastContactAt: MaybeString }) {
  if (record.firstOutreachAt || record.lastContactAt) return "CONTACTED";
  if (record.commercialProgress && record.commercialProgress !== "NOT_CONTACTED") return record.commercialProgress;
  return "NOT_CONTACTED";
}
export function pipelineAttention(record: { currentAction: string; nextFollowUpAt: MaybeString; commercialProgress: string }) {
  if (record.currentAction === "CALL_BACK_REQUESTED" || record.commercialProgress === "CALL_BACK_REQUESTED") return "CALL_BACK_REQUESTED";
  if (record.currentAction === "REVIEW_DATA" || record.commercialProgress === "REVIEW_DATA") return "REVIEW_DATA";
  if (record.nextFollowUpAt) return "FOLLOW_UP_DUE";
  if (record.currentAction === "REVIEW_COMPANY") return "REVIEW_COMPANY";
  return "NONE";
}
export function toPipelineCompanySummary(record: {
  companyId: string; legalName: MaybeString; tradeName: MaybeString; sector: MaybeString; countryCode: MaybeString; countryRaw: MaybeString; website: MaybeString; email: MaybeString; phone: MaybeString;
  commercialProgress: string; firstOutreachAt: MaybeString; lastContactAt: MaybeString; replyStatus: string; nextFollowUpAt: MaybeString; lifecycleStatus: string; currentAction: string;
  companyCategories?: Array<{ category?: { displayName: string } | null }>;
  contactPoints?: Array<{ contactType: string; active: number; verificationStatus: string; sendAttempts?: Array<{ status: string }> }>;
}): PipelineCompanySummary {
  const points = record.contactPoints ?? [];
  const emailPoints = points.filter((point) => point.contactType === "EMAIL" && point.active);
  const phonePoints = points.filter((point) => point.contactType === "PHONE" && point.active);
  const whatsappPoints = points.filter((point) => point.contactType === "WHATSAPP" && point.active);
  const emailAttempts = emailPoints.flatMap((point) => point.sendAttempts ?? []);
  const verified = (items: typeof points) => items.some((point) => ["VERIFIED", "OPERATOR_CONFIRMED"].includes(point.verificationStatus));
  const emailOutreachStatus = emailAttempts.some((attempt) => attempt.status === "SENT") || record.firstOutreachAt ? "SENT" : emailAttempts.some((attempt) => attempt.status === "FAILED") ? "FAILED" : "NOT_SENT";
  return {
    companyId: record.companyId, name: pipelineCompanyName(record), legalName: record.legalName, sector: record.sector,
    category: record.companyCategories?.map((item) => item.category?.displayName).filter(Boolean).join(", ") || null,
    countryCode: record.countryCode, countryRaw: record.countryRaw, website: record.website, email: record.email, phone: record.phone,
    contactStatus: pipelineContactStatus(record), emailOutreachStatus,
    phoneStatus: phonePoints.length && verified(phonePoints) ? "VERIFIED" : phonePoints.length ? "UNVERIFIED" : "NONE",
    whatsappStatus: whatsappPoints.length && verified(whatsappPoints) ? "VERIFIED" : whatsappPoints.length ? "UNVERIFIED" : "NONE",
    commercialStatus: record.commercialProgress || "NOT_CONTACTED", attention: pipelineAttention(record), replyStatus: record.replyStatus,
    lastContactAt: record.lastContactAt, nextFollowUpAt: record.nextFollowUpAt, currentAction: record.currentAction, lifecycleStatus: record.lifecycleStatus,
  };
}
