"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { ChevronDown, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/api";
import {
  PRICE_RANGES,
  SORT_OPTIONS,
  activeFilterCount,
  normalizePrice,
  productsHref,
  type ProductQuery,
} from "@/lib/product-query";

type FilterProps = {
  query: ProductQuery;
  categories: Category[];
};

const bySortOrder = (a: Category, b: Category) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0);

function rootIdOf(category: Category, all: Category[]) {
  let current = category;
  const seen = new Set<string>();
  while (current.parent_id && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = all.find((c) => c.id === current.parent_id);
    if (!parent) break;
    current = parent;
  }
  return current.id;
}

const optionClass = (selected: boolean) =>
  `flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
    selected
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
  }`;

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details open className="group border-b border-border pb-4">
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 font-medium text-foreground [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-1">{children}</div>
    </details>
  );
}

function FilterPanel({
  query,
  categories,
  onNavigate,
}: FilterProps & { onNavigate?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(query.search);
  const [minPrice, setMinPrice] = useState(query.minPrice);
  const [maxPrice, setMaxPrice] = useState(query.maxPrice);

  // Keep the inputs in sync when filters change elsewhere (chips, back button)
  useEffect(() => setSearch(query.search), [query.search]);
  useEffect(() => {
    setMinPrice(query.minPrice);
    setMaxPrice(query.maxPrice);
  }, [query.minPrice, query.maxPrice]);

  const go = (overrides: Partial<ProductQuery>) => {
    startTransition(() => router.push(productsHref(query, overrides)));
    onNavigate?.();
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    go({ search: search.trim() });
  };

  const submitPrice = (event: FormEvent) => {
    event.preventDefault();
    let min = normalizePrice(minPrice);
    let max = normalizePrice(maxPrice);
    if (min && max && Number(min) > Number(max)) [min, max] = [max, min];
    go({ minPrice: min, maxPrice: max });
  };

  const roots = categories.filter((c) => !c.parent_id).sort(bySortOrder);
  const activeCategory = categories.find((c) => c.slug === query.category);
  const activeRootId = activeCategory
    ? rootIdOf(activeCategory, categories)
    : null;
  const count = activeFilterCount(query);

  return (
    <div className={`space-y-5 ${isPending ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-foreground" />
          <span className="font-medium text-foreground">Filters</span>
          {count > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
              {count}
            </span>
          )}
        </div>
        {count > 0 && (
          <Link
            href="/products"
            onClick={onNavigate}
            className="text-sm text-accent hover:underline"
          >
            Clear all
          </Link>
        )}
      </div>

      {/* Search */}
      <form
        onSubmit={submitSearch}
        role="search"
        className="relative border-b border-border pb-4"
      >
        <Input
          type="search"
          placeholder="Search products..."
          aria-label="Search products"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pr-10"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-3 top-[calc(50%-0.5rem)] -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Categories */}
      {roots.length > 0 && (
        <FilterSection title="Categories">
          <Link
            href={productsHref(query, { category: "" })}
            onClick={onNavigate}
            aria-current={!query.category ? "true" : undefined}
            className={optionClass(!query.category)}
          >
            All Categories
          </Link>
          {roots.map((root) => {
            const children = categories
              .filter((c) => c.parent_id === root.id)
              .sort(bySortOrder);
            return (
              <div key={root.id}>
                <Link
                  href={productsHref(query, { category: root.slug })}
                  onClick={onNavigate}
                  aria-current={
                    query.category === root.slug ? "true" : undefined
                  }
                  className={optionClass(query.category === root.slug)}
                >
                  {root.name}
                </Link>
                {root.id === activeRootId &&
                  children.map((child) => (
                    <Link
                      key={child.id}
                      href={productsHref(query, { category: child.slug })}
                      onClick={onNavigate}
                      aria-current={
                        query.category === child.slug ? "true" : undefined
                      }
                      className={`ml-4 ${optionClass(query.category === child.slug)}`}
                    >
                      {child.name}
                    </Link>
                  ))}
              </div>
            );
          })}
        </FilterSection>
      )}

      {/* Price */}
      <FilterSection title="Price">
        <Link
          href={productsHref(query, { minPrice: "", maxPrice: "" })}
          onClick={onNavigate}
          className={optionClass(!query.minPrice && !query.maxPrice)}
        >
          Any Price
        </Link>
        {PRICE_RANGES.map((range) => {
          const selected =
            query.minPrice === range.min && query.maxPrice === range.max;
          return (
            <Link
              key={range.label}
              href={productsHref(query, {
                minPrice: range.min,
                maxPrice: range.max,
              })}
              onClick={onNavigate}
              aria-current={selected ? "true" : undefined}
              className={optionClass(selected)}
            >
              {range.label}
            </Link>
          );
        })}

        <form onSubmit={submitPrice} className="flex items-center gap-2 pt-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            aria-label="Minimum price in KES"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            aria-label="Maximum price in KES"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
          <Button type="submit" size="sm" variant="outline">
            Go
          </Button>
        </form>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          <input
            type="checkbox"
            checked={query.sale}
            onChange={() => go({ sale: !query.sale })}
            className="h-4 w-4 accent-accent"
          />
          On sale
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          <input
            type="checkbox"
            checked={query.inStock}
            onChange={() => go({ inStock: !query.inStock })}
            className="h-4 w-4 accent-accent"
          />
          In stock only
        </label>
      </FilterSection>
    </div>
  );
}

/** Desktop sidebar panel */
export function ProductFilters({ query, categories }: FilterProps) {
  return <FilterPanel query={query} categories={categories} />;
}

/** Mobile: a button that opens the same filters in a slide-over drawer */
export function MobileFilters({ query, categories }: FilterProps) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(query);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 lg:hidden"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Filter className="h-4 w-4" />
        Filters
        {count > 0 && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
            {count}
          </span>
        )}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-[60] flex w-[320px] max-w-[90vw] transform flex-col bg-card shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="font-semibold text-foreground">Filters</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
            className="rounded-lg p-2 hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {open && (
            <FilterPanel
              query={query}
              categories={categories}
              onNavigate={() => setOpen(false)}
            />
          )}
        </div>

        <div className="border-t border-border p-4">
          <Button className="w-full" onClick={() => setOpen(false)}>
            Show results
          </Button>
        </div>
      </div>
    </>
  );
}

/** Sort dropdown shown above the results */
export function SortSelect({ query }: { query: ProductQuery }) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Sort by:</span>
      <select
        value={query.sort || "newest"}
        onChange={(event) => {
          const value = event.target.value;
          router.push(
            productsHref(query, { sort: value === "newest" ? "" : value }),
          );
        }}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
