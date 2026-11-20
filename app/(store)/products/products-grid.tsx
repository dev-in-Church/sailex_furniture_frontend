import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  SearchX,
  TriangleAlert,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductsResponse } from "@/lib/api";
import { fetchJson } from "@/lib/server-fetch";
import {
  PAGE_SIZE,
  activeFilterCount,
  productsHref,
  toApiQuery,
  type ProductQuery,
} from "@/lib/product-query";
import { ProductCard } from "@/components/home/product-card";
import { SortSelect } from "./product-filters";

const gridClass =
  "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4";

export function ProductsGridSkeleton() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className={gridClass}>
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-border p-0"
          >
            <Skeleton className="aspect-square rounded-b-none rounded-t-xl" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-8 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
        <SearchX className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-lg font-medium text-foreground">
        No products found
      </h2>
      <p className="mb-6 text-muted-foreground">
        {filtered
          ? "Try adjusting your search or filters."
          : "Check back soon, we're adding new pieces."}
      </p>
      {filtered && (
        <Link
          href="/products"
          className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary"
        >
          Clear all filters
        </Link>
      )}
    </div>
  );
}

function LoadError({ retryHref }: { retryHref: string }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
        <TriangleAlert className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-lg font-medium text-foreground">
        We couldn&apos;t load products
      </h2>
      <p className="mb-6 text-muted-foreground">
        Something went wrong on our side. Please try again.
      </p>
      <Link
        href={retryHref}
        className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary"
      >
        Try again
      </Link>
    </div>
  );
}

// 1 … 4 5 6 … 20
function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

const pageLinkClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-3 text-sm transition-colors hover:bg-secondary";

function Pagination({
  query,
  page,
  totalPages,
}: {
  query: ProductQuery;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link
          href={productsHref(query, { page: page - 1 })}
          aria-label="Previous page"
          className={pageLinkClass}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {pageWindow(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={productsHref(query, { page: item })}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={`${pageLinkClass} ${
              item === page
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary"
                : ""
            }`}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages && (
        <Link
          href={productsHref(query, { page: page + 1 })}
          aria-label="Next page"
          className={pageLinkClass}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}

export async function ProductsResults({ query }: { query: ProductQuery }) {
  const { data } = await fetchJson<ProductsResponse>(
    `/products?${toApiQuery(query)}`,
    60,
  );

  if (!data) {
    return <LoadError retryHref={productsHref(query, { page: query.page })} />;
  }

  const { products, pagination } = data;

  // Someone opened ?page=99 on a smaller result set: go to the last page
  if (products.length === 0 && pagination.total > 0 && query.page > 1) {
    redirect(productsHref(query, { page: pagination.totalPages }));
  }

  if (products.length === 0) {
    return <EmptyState filtered={activeFilterCount(query) > 0} />;
  }

  const from = (pagination.page - 1) * pagination.limit + 1;
  const to = from + products.length - 1;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {from}–{to}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {pagination.total}
          </span>{" "}
          products
        </p>
        <SortSelect query={query} />
      </div>

      <ul className={gridClass}>
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>

      <Pagination
        query={query}
        page={pagination.page}
        totalPages={pagination.totalPages}
      />
    </div>
  );
}
