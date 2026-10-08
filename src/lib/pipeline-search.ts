export function safeWebsiteHref(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export const REPLY_STATUSES = ["NO_REPLY", "REPLIED", "REPLY_REQUIRED", "NEEDS_REPLY"] as const;
export const LIFECYCLE_STATUSES = ["DISCOVERED", "CONTACT_READY", "CONTACTED", "AWAITING_REPLY", "COMPLETED", "REFUSED", "UNREACHABLE"] as const;
export const COMMERCIAL_STATUSES = ["NOT_CONTACTED", "WAITING_REPLY", "WAITING_CATALOG", "WAITING_PRICES", "WAITING_CATALOG_AND_PRICES", "WAITING_INFORMATION", "PARTIAL_DATA_RECEIVED", "DATA_RECEIVED", "REVIEW_DATA", "COMPLETED", "REFUSED", "UNREACHABLE"] as const;
export const ATTENTION_STATES = ["NONE", "FOLLOW_UP_DUE", "CALL_BACK_REQUESTED", "REVIEW_DATA", "REVIEW_COMPANY"] as const;
export const EMAIL_OUTREACH_STATUSES = ["NOT_SENT", "SENT", "FAILED"] as const;
