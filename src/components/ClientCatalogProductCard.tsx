import { ArrowRight, Boxes, Heart } from "lucide-react";

import type { ClientCatalogProductDto } from "@/lib/client-catalog-types";

export function ClientCatalogProductCard({
  product,
  onToggleFavorite,
  favoriteBusy = false,
}: {
  product: ClientCatalogProductDto;
  onToggleFavorite?: (product: ClientCatalogProductDto) => void;
  favoriteBusy?: boolean;
}) {
  const image = product.variants.find((variant) => variant.mainImageUrl)?.mainImageUrl;
  const price = product.variants.find((variant) => variant.price)?.price;
  const href = `/client/products/${encodeURIComponent(product.reference)}`;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <a href={href} aria-label={`View ${product.name}`} className="block">
          <div className="flex h-52 items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
            {image ? (
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-[#17436a] shadow-sm">
                <Boxes className="h-9 w-9" />
              </div>
            )}
            <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              {product.variants.length} {product.variants.length === 1 ? "format" : "formats"}
            </span>
          </div>
        </a>
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={product.isFavorite ? "Remove from favorites" : "Save to favorites"}
            aria-pressed={product.isFavorite}
            disabled={favoriteBusy}
            onClick={() => onToggleFavorite(product)}
            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:scale-105 disabled:opacity-50 ${product.isFavorite ? "text-rose-600" : "text-slate-500 hover:text-rose-600"}`}
          >
            <Heart className="h-5 w-5" fill={product.isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <div className="p-5">
        {product.taxonomy.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {product.taxonomy.at(-1)?.name}
          </p>
        )}
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-[#102c50]">
          <a href={href} className="hover:underline">
            {product.name}
          </a>
        </h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
          {product.shortDescription ??
            product.description ??
            "Explore specifications and available formats."}
        </p>
        <p className="mt-3 text-xs font-medium tracking-wide text-slate-500">
          Wossol reference · {product.reference}
        </p>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm font-semibold text-[#102c50]">
            {price
              ? `${price.price} ${price.currency}`
              : product.pricesVisible
                ? "Price on request"
                : "Contact for pricing"}
          </span>
          <a
            href={href}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#17436a]"
          >
            Details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </article>
  );
}
