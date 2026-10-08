import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { pipelineAttention, pipelineCompanyName, pipelineContactStatus, safeWebsiteHref, toPipelineCompanySummary } from "./pipeline-search.dto.ts";

test("Pipeline summary prefers trade name and exposes contact status without catalog identity", () => {
  assert.equal(pipelineCompanyName({ companyId: "CMP-1", legalName: "Legal", tradeName: "Trade" }), "Trade");
  assert.equal(pipelineContactStatus({ commercialProgress: "NOT_CONTACTED", firstOutreachAt: null, lastContactAt: null }), "NOT_CONTACTED");
  assert.equal(pipelineContactStatus({ commercialProgress: "NOT_CONTACTED", firstOutreachAt: "2026-01-01", lastContactAt: null }), "CONTACTED");
});

test("Pipeline summary keeps channel status separate and derives operational attention", () => {
  const summary = toPipelineCompanySummary({
    companyId: "CMP-1", legalName: "Legal", tradeName: "Trade", sector: "Packaging", countryCode: "DZ", countryRaw: "Algeria", website: null, email: "sales@example.test", phone: "+213", commercialProgress: "WAITING_REPLY", firstOutreachAt: "2026-01-01", lastContactAt: "2026-01-02", replyStatus: "NO_REPLY", nextFollowUpAt: "2026-01-03", lifecycleStatus: "CONTACTED", currentAction: "WAIT_REPLY",
    contactPoints: [
      { contactType: "PHONE", active: 1, verificationStatus: "UNVERIFIED", sendAttempts: [] },
      { contactType: "WHATSAPP", active: 1, verificationStatus: "OPERATOR_CONFIRMED", sendAttempts: [] },
      { contactType: "EMAIL", active: 1, verificationStatus: "VERIFIED", sendAttempts: [{ status: "SENT" }] },
    ],
  });
  assert.equal(summary.emailOutreachStatus, "SENT");
  assert.equal(summary.phoneStatus, "UNVERIFIED");
  assert.equal(summary.whatsappStatus, "VERIFIED");
  assert.equal(summary.attention, "FOLLOW_UP_DUE");
  assert.equal(pipelineAttention({ currentAction: "WAIT_REPLY", commercialProgress: "WAITING_REPLY", nextFollowUpAt: null }), "NONE");
});

test("stored websites become clickable only for HTTP(S)", () => {
  assert.equal(safeWebsiteHref("https://example.test/path"), "https://example.test/path");
  assert.equal(safeWebsiteHref("http://example.test"), "http://example.test/");
  assert.equal(safeWebsiteHref("javascript:alert(1)"), null);
  assert.equal(safeWebsiteHref("data:text/html,unsafe"), null);
  assert.equal(safeWebsiteHref("file:///secret"), null);
  assert.equal(safeWebsiteHref("not a URL"), null);
});

test("Search server functions use the internal read capability and never client/partner guards", async () => {
  const source = await readFile(new URL("../../lib/api/pipeline-search.functions.ts", import.meta.url), "utf8");
  assert.match(source, /requireCatalogCapability\("catalog\.read_internal"\)/);
  assert.doesNotMatch(source, /requireClientActor|requirePartnerActor/);
  assert.doesNotMatch(source, /createAdminCompany|updateAdminCompany|sendMail|discovery/);
});

test("Search UI is read-only, admin navigation only, and has an imported-data empty state", async () => {
  const [nav, list, detail] = await Promise.all([
    readFile(new URL("../../lib/admin.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../routes/admin/search/index.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../routes/admin/search/$companyId.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(nav, /Pipeline Search/);
  assert.match(list, /No Pipeline data imported/);
  assert.match(list, /Email outreach/);
  assert.match(list, /pipeline-country-options/);
  assert.match(list, /replaceState/);
  assert.match(detail, /Tracking \/ Activity/);
  assert.match(detail, /Communications/);
  assert.match(detail, /Audit/);
  assert.match(detail, /Arabic operator translation/);
  assert.doesNotMatch(list + detail, /createAdmin|updateAdmin|sendMail|smtp|discovery execution/i);
});
