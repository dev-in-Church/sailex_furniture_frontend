"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/api";
import { CartControl } from "./cart-control";
import { WhatsAppOrderButton } from "./whatsapp-button";

const PLACEHOLDER = "/placeholder.png";
const LOW_STOCK_THRESHOLD = 10;

const formatKES = (value: string | number) =>
  `KES ${Number(value).toLocaleString("en-KE")}`;

export function ProductCard({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);

  const price = Number(product.price);
  const compareAt = Number(product.compare_at_price);
  const discount =
    compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;

  const stock = Number(product.stock_quantity);
  const hasStockInfo = Number.isFinite(stock);
  const outOfStock = hasStockInfo && stock <= 0;
  const lowStock = hasStockInfo && stock > 0 && stock <= LOW_STOCK_THRESHOLD;

  const firstImage = product.images?.[0];
  const src =
    !imageFailed && typeof firstImage === "string" && firstImage
      ? firstImage
      : PLACEHOLDER;

  const productHref = `/products/${product.slug}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md">
      {/* Image area: link underneath, controls on top (no buttons inside the link) */}
      <div className="relative aspect-square bg-muted/40">
        <Link
          href={productHref}
          aria-label={product.name}
          className="absolute inset-0"
        >
          <Image
            src={src}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        </Link>

        {!outOfStock && <CartControl product={product} />}

        {outOfStock && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-semibold text-foreground">
            Out of stock
          </span>
        )}

        {lowStock && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-amber-100 py-1 text-center text-xs font-medium text-amber-800">
            Only {stock} left in stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <Link
          href={productHref}
          className="line-clamp-2 min-h-[2.5rem] text-sm text-foreground transition-colors group-hover:text-accent"
        >
          {product.name}
        </Link>

        <p className="mt-2 text-base font-bold text-foreground sm:text-lg">
          {formatKES(price)}
        </p>

        {discount > 0 && (
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground line-through">
              {formatKES(compareAt)}
            </span>
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">
              -{discount}%
            </span>
          </div>
        )}

        {!outOfStock && (
          <div className="mt-auto pt-3">
            <WhatsAppOrderButton product={product} />
          </div>
        )}
      </div>
    </article>
  );
}
