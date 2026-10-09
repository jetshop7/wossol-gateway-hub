import { useState } from "react";
import { ArrowLeft, Check, Copy, Heart, Image as ImageIcon, X } from "lucide-react";

import type { ClientCatalogProductDto, ClientCatalogVariantDto } from "@/lib/client-catalog-types";
import { clientCountryLabel } from "@/lib/countries";

const fieldLabels: Record<string, string> = {
  netQuantity: "Net content",
  packagingType: "Pack format",
  unitsPerCarton: "Units per carton",
  cartonNetWeight: "Carton net weight",
  cartonGrossWeight: "Carton gross weight",
  cartonLength: "Carton length",
  cartonWidth: "Carton width",
  cartonHeight: "Carton height",
  unitsPerPallet: "Units per pallet",
  cartonsPerPallet: "Cartons per pallet",
  moqQuantity: "Minimum order quantity",
  productionCapacityQuantity: "Production capacity",
  leadTimeMinimum: "Lead time from",
  leadTimeMaximum: "Lead time up to",
  sampleAvailable: "Samples",
  bundleWeight: "Bundle weight",
  tieWire: "Tying wire",
  straightBarTiePoints: "Straight-bar tie points",
  coilTiePoints: "Coil tie points",
};

function formatValue(
  key: string,
  value: string | number | boolean,
  variant: ClientCatalogVariantDto,
) {
  if (key === "netQuantity")
    return `${value}${variant.packaging.netQuantityUnit ? ` ${variant.packaging.netQuantityUnit}` : ""}`;
  if (key === "moqQuantity")
    return `${value}${variant.packaging.moqUnit ? ` ${variant.packaging.moqUnit}` : ""}`;
  if (key === "productionCapacityQuantity")
    return `${value}${variant.packaging.productionCapacityUnit ? ` ${variant.packaging.productionCapacityUnit}` : ""}${variant.packaging.productionCapacityPeriod ? ` / ${variant.packaging.productionCapacityPeriod}` : ""}`;
  if (key === "leadTimeMinimum" || key === "leadTimeMaximum")
    return `${value}${variant.packaging.leadTimeUnit ? ` ${variant.packaging.leadTimeUnit}` : ""}`;
  if (key === "sampleAvailable")
    return value === true || value === "YES"
      ? "Available"
      : value === false || value === "NO"
        ? "Not available"
        : "To be confirmed";
  return String(value);
}

function VariantGallery({ variant }: { variant: ClientCatalogVariantDto }) {
  const images = [variant.mainImageUrl, ...variant.additionalImageUrls].filter(
    (source): source is string => Boolean(source),
  );
  const [selected, setSelected] = useState(0);
  const [enlarged, setEnlarged] = useState(false);
  const source = images[selected];

  return (
    <div>
      <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-blue-50 sm:h-80">
        {source ? (
          <button
            type="button"
            onClick={() => setEnlarged(true)}
            className="h-full w-full"
            aria-label="Enlarge product image"
          >
            <img
              src={source}
              alt={variant.name ?? "Product format"}
              className="h-full w-full object-contain"
            />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageIcon className="h-10 w-10" />
            <span className="text-sm">No product image available</span>
          </div>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
            {selected + 1} / {images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Product images">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show product image ${index + 1}`}
              aria-pressed={selected === index}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${selected === index ? "border-[#17436a]" : "border-transparent"}`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {enlarged && source && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setEnlarged(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Enlarged product image"
            className="relative max-h-full max-w-6xl"
          >
            <button
              type="button"
              onClick={() => setEnlarged(false)}
              aria-label="Close enlarged image"
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-2 text-slate-900 shadow"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={source}
              alt={variant.name ?? "Product format"}
              className="max-h-[90vh] max-w-full rounded-xl object-contain"
            />
          </section>
        </div>
      )}
    </div>
  );
}

export function ClientCatalogProductDetail({
  product,
  onToggleFavorite,
  favoriteBusy,
  workspaceBase = "/client",
}: {
  product: ClientCatalogProductDto;
  onToggleFavorite: () => void;
  favoriteBusy: boolean;
  workspaceBase?: "/client" | "/partner";
}) {
  const [copied, setCopied] = useState(false);
  const packagingKeys = [
    "netQuantity",
    "packagingType",
    "unitsPerCarton",
    "cartonNetWeight",
    "cartonGrossWeight",
    "cartonLength",
    "cartonWidth",
    "cartonHeight",
    "unitsPerPallet",
    "cartonsPerPallet",
    "bundleWeight",
    "tieWire",
    "straightBarTiePoints",
    "coilTiePoints",
  ];
  const supplyKeys = [
    "moqQuantity",
    "productionCapacityQuantity",
    "leadTimeMinimum",
    "leadTimeMaximum",
    "sampleAvailable",
  ];
  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(product.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <a
        href={workspaceBase}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#17436a] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to catalog
      </a>
      <section className="mt-6 rounded-3xl bg-gradient-to-br from-[#0b2342] via-[#123860] to-[#1d5077] p-6 text-white shadow-lg sm:p-10">
        {product.taxonomy.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
            {product.taxonomy.map((item) => item.name).join(" / ")}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-sm text-blue-100">Wossol Product Reference</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold tracking-wide">
                {product.reference}
              </code>
              <button
                type="button"
                onClick={() => void copyReference()}
                className="inline-flex items-center gap-1 rounded-lg border border-white/30 px-3 py-2 text-sm hover:bg-white/10"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy reference"}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={favoriteBusy}
            aria-pressed={product.isFavorite}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#102c50] disabled:opacity-60"
          >
            <Heart
              className={`h-5 w-5 ${product.isFavorite ? "fill-rose-600 text-rose-600" : ""}`}
            />
            {product.isFavorite ? "Saved to favorites" : "Save product"}
          </button>
        </div>
        {(product.shortDescription || product.description) && (
          <p className="mt-6 max-w-3xl text-base leading-7 text-blue-50">
            {product.description ?? product.shortDescription}
          </p>
        )}
        {product.countryOfOrigin && (
          <p className="mt-5 text-sm text-blue-100">
            Country of origin:{" "}
            <span className="font-semibold text-white">
              {clientCountryLabel(product.countryOfOrigin)}
            </span>
          </p>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
            Available configurations
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#102c50]">Formats & specifications</h2>
        </div>
        <div className="space-y-6">
          {product.variants.map((variant, index) => {
            const packaging = Object.entries(variant.packaging).filter(([key]) =>
              packagingKeys.includes(key),
            );
            const supply = Object.entries(variant.packaging).filter(([key]) =>
              supplyKeys.includes(key),
            );
            return (
              <article
                key={`${variant.name ?? "format"}-${index}`}
                className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[0.95fr_1.05fr] lg:p-7"
              >
                <VariantGallery variant={variant} />
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Format {index + 1}
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold text-[#102c50]">
                        {variant.name ?? "Available format"}
                      </h3>
                      {variant.model && (
                        <p className="mt-1 text-sm text-slate-500">{variant.model}</p>
                      )}
                    </div>
                    <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-[#102c50]">
                      {variant.price
                        ? `${variant.price.price} ${variant.price.currency}`
                        : product.pricesVisible
                          ? "Price on request"
                          : "Contact for pricing"}
                    </p>
                  </div>
                  {packaging.length > 0 && (
                    <section className="mt-6">
                      <h4 className="text-sm font-semibold text-slate-800">Packaging</h4>
                      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                        {packaging.map(([key, value]) => (
                          <div key={key} className="rounded-xl bg-slate-50 px-3 py-2.5">
                            <dt className="text-xs text-slate-500">
                              {fieldLabels[key] ?? "Specification"}
                            </dt>
                            <dd className="mt-1 text-sm font-medium text-slate-800">
                              {formatValue(key, value, variant)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}
                  {supply.length > 0 && (
                    <section className="mt-6">
                      <h4 className="text-sm font-semibold text-slate-800">Ordering & supply</h4>
                      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                        {supply.map(([key, value]) => (
                          <div key={key} className="rounded-xl bg-slate-50 px-3 py-2.5">
                            <dt className="text-xs text-slate-500">
                              {fieldLabels[key] ?? "Specification"}
                            </dt>
                            <dd className="mt-1 text-sm font-medium text-slate-800">
                              {formatValue(key, value, variant)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}
                  {variant.specifications.length > 0 && (
                    <section className="mt-6">
                      <h4 className="text-sm font-semibold text-slate-800">Technical specifications</h4>
                      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                        {variant.specifications.map((item) => (
                          <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                            <dt className="text-xs text-slate-500">{item.label}</dt>
                            <dd className="mt-1 text-sm font-medium text-slate-800">{item.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}
                  {!packaging.length && !supply.length && !variant.specifications.length && (
                    <p className="mt-6 text-sm text-slate-500">
                      Contact Wossol for further format specifications.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
