import { useEffect, useState } from "react";
import { createFileRoute, useLoaderData, useNavigate } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, RefreshCw, ShieldCheck } from "lucide-react";

import {
  acceptProductExtractionReviewFn,
  createProductExtractionReviewFn,
  getAdminProductsDirectoryFn,
  getProductExtractionReviewFn,
  listProductExtractionReviewsFn,
  publishProductExtractionReviewFn,
  requestProductExtractionCorrectionFn,
} from "@/lib/api/catalog-admin.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

export const Route = createFileRoute("/admin/catalog/extraction-reviews")({
  loader: async () => {
    const [reviewResult, productResult] = await Promise.all([
      listProductExtractionReviewsFn({ data: {} }),
      getAdminProductsDirectoryFn({ data: { query: "", page: 0, pageSize: 50 } }),
    ]);
    return { ...reviewResult, products: productResult.products };
  },
  component: ExtractionReviewsPage,
});

type ReviewSummary = Awaited<ReturnType<typeof listProductExtractionReviewsFn>>["reviews"][number];
type ReviewDetail = NonNullable<Awaited<ReturnType<typeof getProductExtractionReviewFn>>["review"]>;

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
}

function badge(value: string) {
  const colors = value === "ACCEPTED" || value === "PUBLISHED"
    ? "bg-emerald-50 text-emerald-700"
    : value === "REQUIRES_CORRECTION"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors}`}>{label(value)}</span>;
}

function ExtractionReviewsPage() {
  const initial = Route.useLoaderData();
  const { actor } = useLoaderData({ from: "/admin/catalog" });
  const canPublish = actor?.role === "CATALOG_ADMIN";
  const [reviews, setReviews] = useState(initial.reviews as ReviewSummary[]);
  const [products] = useState(initial.products);
  const [newProductId, setNewProductId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(reviews[0]?.id ?? null);
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [filter, setFilter] = useState("");
  const [correction, setCorrection] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const load = async (id: string | null = selectedId) => {
    if (!id) return;
    setError("");
    const result = await getProductExtractionReviewFn({ data: { reviewId: id } });
    if (result.ok) setDetail(result.review);
  };

  useEffect(() => { void load(); }, [selectedId]);

  const refresh = async () => {
    const result = await listProductExtractionReviewsFn({ data: filter ? { state: filter as never } : {} });
    if (!result.ok) return;
    setReviews(result.reviews as ReviewSummary[]);
    const nextId = selectedId && result.reviews.some((review) => review.id === selectedId)
      ? selectedId
      : result.reviews[0]?.id ?? null;
    setSelectedId(nextId);
    await load(nextId);
  };

  const mutate = async (operation: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await operation();
      if (!result.ok) { setError(result.error ?? "The review action could not be completed."); return; }
      setNotice("Review updated. The event history was preserved.");
      setCorrection(""); setDecisionNote(""); await refresh();
    } catch { setError("The review action could not be completed."); }
    finally { setBusy(false); }
  };

  const requestCorrection = () => {
    if (!detail || !correction.trim()) return;
    void mutate(() => requestProductExtractionCorrectionFn({
      data: { reviewId: detail.id, correctionNote: correction },
      headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
    }));
  };

  const accept = () => {
    if (!detail) return;
    void mutate(() => acceptProductExtractionReviewFn({
      data: { reviewId: detail.id, expectedRevisionHash: detail.currentRevisionHash, decisionNote: decisionNote || undefined },
      headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
    }));
  };

  const publish = () => {
    if (!detail) return;
    void mutate(() => publishProductExtractionReviewFn({
      data: { reviewId: detail.id },
      headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
    }));
  };

  const createReview = () => {
    const product = products.find((candidate) => candidate.id === newProductId);
    if (!product) return;
    void mutate(() => createProductExtractionReviewFn({
      data: { companyId: product.companyId, productId: product.id },
      headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
    }));
  };

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Catalog operations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Product extraction review</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Inspect source-backed product evidence, request corrections, accept internally, and publish only after explicit Catalog Admin approval.</p></div>
      <div className="flex flex-wrap items-center gap-2"><select value={newProductId} onChange={(event) => setNewProductId(event.target.value)} className="h-10 max-w-xs rounded-md border px-3 text-sm"><option value="">Choose a product to review</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.companyName}</option>)}</select><button type="button" disabled={!newProductId || busy} onClick={createReview} className="h-10 rounded-md bg-amber-500 px-3 text-sm font-semibold disabled:opacity-50">Start review</button><button type="button" onClick={() => void refresh()} className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
    </header>
    {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)]">
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">Review queue</h2><p className="mt-1 text-xs text-slate-500">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p></div><select value={filter} onChange={(event) => { setFilter(event.target.value); void (async () => { const result = await listProductExtractionReviewsFn({ data: event.target.value ? { state: event.target.value as never } : {} }); if (result.ok) { setReviews(result.reviews as ReviewSummary[]); setSelectedId(result.reviews[0]?.id ?? null); } })(); }} className="rounded-md border px-2 py-2 text-xs"><option value="">All states</option><option value="UNDER_REVIEW">Under review</option><option value="REQUIRES_CORRECTION">Requires correction</option><option value="ACCEPTED">Accepted</option><option value="PUBLISHED">Published</option></select></div>
        {reviews.length === 0 ? <div className="p-10 text-center"><FileCheck2 className="mx-auto h-9 w-9 text-slate-400" /><h3 className="mt-3 font-semibold">No extraction reviews</h3><p className="mt-1 text-sm text-slate-500">Create a review from an existing Catalog product when extraction evidence is ready.</p></div> : <div className="divide-y">{reviews.map((review) => <button type="button" key={review.id} onClick={() => setSelectedId(review.id)} className={`block w-full p-4 text-left hover:bg-slate-50 ${selectedId === review.id ? "bg-amber-50/50 ring-1 ring-inset ring-amber-200" : ""}`}><div className="flex items-start justify-between gap-3"><span className="font-semibold text-slate-900">{review.product?.name ?? "Product not linked"}</span>{badge(review.state)}</div><p className="mt-1 text-sm text-slate-600">{review.company.displayName}</p><p className="mt-2 text-xs text-slate-500">Updated {new Date(review.updatedAt).toLocaleString()}</p></button>)}</div>}
      </section>
      <ReviewPanel detail={detail} canPublish={canPublish} busy={busy} correction={correction} decisionNote={decisionNote} setCorrection={setCorrection} setDecisionNote={setDecisionNote} onCorrection={requestCorrection} onAccept={accept} onPublish={publish} onOpenProduct={(productId) => { if (detail?.companyId) void navigate({ to: "/admin/catalog/companies/$companyId", params: { companyId: detail.companyId }, search: { editProductId: productId } }); }} />
    </div>
  </div>;
}

function ReviewPanel({ detail, canPublish, busy, correction, decisionNote, setCorrection, setDecisionNote, onCorrection, onAccept, onPublish, onOpenProduct }: { detail: ReviewDetail | null; canPublish: boolean; busy: boolean; correction: string; decisionNote: string; setCorrection: (value: string) => void; setDecisionNote: (value: string) => void; onCorrection: () => void; onAccept: () => void; onPublish: () => void; onOpenProduct: (productId: string) => void }) {
  if (!detail) return <section className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500">Select a review to inspect its evidence and decision history.</section>;
  return <section className="space-y-6 rounded-xl border bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review detail</p><h2 className="mt-1 text-2xl font-semibold">{detail.product?.name ?? "Unlinked product"}</h2><p className="mt-1 text-sm text-slate-600">{detail.companyId} · extracted {new Date(detail.extractedAt).toLocaleDateString()}</p></div><div className="flex items-center gap-2">{badge(detail.state)}{detail.productId && <button type="button" onClick={() => onOpenProduct(detail.productId!)} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-800 underline">Open product <ArrowRight className="h-4 w-4" /></button>}</div></div>
    <div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3"><Info label="Verification" value={label(detail.verificationState)} /><Info label="Revision" value={detail.currentRevisionHash.slice(0, 12) + "…"} /><Info label="Publication" value={detail.product?.publicationStatus ? label(detail.product.publicationStatus) : "Not linked"} /></div>
    <Evidence title="Sources" items={detail.sources.map((source) => `${label(source.kind)} · ${source.url}`)} /><Evidence title="Evidence" items={detail.evidence.map((item) => `${item.fieldPath} · ${label(item.confidence)} · ${String(item.extractedValue)}`)} /><Evidence title="Assets" items={detail.assets.map((asset) => `${label(asset.kind)} · ${asset.originalUrl} · rights ${label(asset.rightsStatus)}`)} />
    <div><h3 className="font-semibold">Operator actions</h3><p className="mt-1 text-sm text-slate-500">Acceptance records the exact product revision. Any material product edit invalidates that approval.</p><div className="mt-3 grid gap-3 md:grid-cols-2"><div className="rounded-lg border p-3"><label className="block text-sm font-medium">Correction note<textarea value={correction} onChange={(event) => setCorrection(event.target.value)} className="mt-2 min-h-24 w-full rounded border p-2" placeholder="Describe what must be corrected" /></label><button type="button" disabled={busy || !correction.trim() || detail.state === "PUBLISHED"} onClick={onCorrection} className="mt-3 rounded-md border px-3 py-2 text-sm font-semibold disabled:opacity-50">Request correction</button></div><div className="rounded-lg border p-3"><label className="block text-sm font-medium">Acceptance note<textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} className="mt-2 min-h-24 w-full rounded border p-2" placeholder="Optional decision note" /></label><button type="button" disabled={busy || !detail.productId || detail.state === "PUBLISHED" || detail.state === "ACCEPTED"} onClick={onAccept} className="mt-3 rounded-md bg-[#102c50] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Accept internally</button></div></div>{detail.state === "ACCEPTED" && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3"><div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-700" /><div><p className="font-semibold text-emerald-900">Accepted, not published</p><p className="mt-1 text-sm text-emerald-800">Only a Catalog Admin may publish this exact reviewed revision.</p>{canPublish ? <button type="button" disabled={busy} onClick={onPublish} className="mt-3 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Publish explicitly</button> : <p className="mt-2 text-xs text-emerald-800">Your role cannot publish catalog products.</p>}</div></div></div>}</div>
    <div><h3 className="font-semibold">Append-only history</h3><ol className="mt-3 space-y-2 border-l pl-4">{detail.reviewEvents.map((event) => <li key={event.id} className="text-sm"><div className="flex flex-wrap items-center gap-2">{badge(event.toState)}<span className="text-slate-500">{event.action}</span></div><p className="mt-1 text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}{event.decisionNote ? ` · ${event.decisionNote}` : ""}</p></li>)}</ol></div>
  </section>;
}

function Evidence({ title, items }: { title: string; items: string[] }) { return <div><h3 className="font-semibold">{title}</h3>{items.length ? <ul className="mt-2 space-y-2 text-sm text-slate-700">{items.map((item, index) => <li key={`${item}-${index}`} className="break-words rounded bg-slate-50 p-2">{item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No {title.toLowerCase()} recorded.</p>}</div>; }
function Info({ label: title, value }: { label: string; value: string }) { return <div><span className="block text-xs uppercase tracking-wide text-slate-500">{title}</span><span className="mt-1 block text-sm font-semibold text-slate-900">{value}</span></div>; }
