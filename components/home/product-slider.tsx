"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/api";
import { ProductCard } from "./product-card";

type Variant = "plain" | "tinted" | "deals";

type ProductSliderProps = {
  title: string;
  /** Shown after a pipe, e.g. "Hot Deals | Up to 40% off" */
  subtitle?: string;
  products: Product[];
  viewAllHref: string;
  variant?: Variant;
};

const VARIANTS: Record<
  Variant,
  { section: string; title: string; button: string }
> = {
  plain: {
    section: "bg-card ring-1 ring-border",
    title: "text-foreground",
    button: "bg-accent text-accent-foreground hover:opacity-90",
  },
  tinted: {
    section: "bg-accent/10",
    title: "text-accent",
    button: "bg-accent text-accent-foreground hover:opacity-90",
  },
  deals: {
    section: "bg-[#c21a3c]",
    title: "text-white",
    button: "bg-white text-[#c21a3c] hover:bg-white/90",
  },
};

// Card widths account for the track's gap (gap-3 = 12px, gap-4 = 16px)
const CARD_WIDTH =
  "basis-[calc(50%-6px)] sm:basis-[calc(33.333%-10.667px)] md:basis-[calc(25%-12px)] xl:basis-[calc(20%-12.8px)]";

export function ProductSlider({
  title,
  subtitle,
  products,
  viewAllHref,
  variant = "plain",
}: ProductSliderProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const headingId = useId();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const styles = VARIANTS[variant];

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateArrows, products]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  const arrowClass =
    "absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-md ring-1 ring-border transition-colors hover:bg-muted sm:flex";

  return (
    <section
      aria-labelledby={headingId}
      className={`mb-6 rounded-2xl p-4 sm:p-5 ${styles.section}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id={headingId}
          className={`text-xl font-extrabold sm:text-2xl ${styles.title}`}
        >
          {title}
          {subtitle && (
            <span className="font-semibold opacity-80"> | {subtitle}</span>
          )}
        </h2>
        <Link
          href={viewAllHref}
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-5 sm:py-2.5 ${styles.button}`}
        >
          See All <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label={`Scroll ${title} left`}
            className={`${arrowClass} left-1`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <ul
          ref={trackRef}
          onScroll={updateArrows}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <li
              key={product.id}
              className={`flex-none snap-start ${CARD_WIDTH}`}
            >
              <ProductCard product={product} />
            </li>
          ))}
        </ul>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label={`Scroll ${title} right`}
            className={`${arrowClass} right-1`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
}
