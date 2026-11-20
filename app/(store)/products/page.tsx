import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, X } from "lucide-react";
import type { Category } from "@/lib/api";
import { fetchJson } from "@/lib/server-fetch";
import {
  activeFilterCount,
  parseProductQuery,
  productsHref,
  type ProductQuery,
  type RawSearchParams,
} from "@/lib/product-query";
import { ProductsGridSkeleton, ProductsResults } from "./products-grid";
import { MobileFilters, ProductFilters } from "./product-filters";

interface ProductsPageProps {
  searchParams: Promise<RawSearchParams>;
}

async function getCategories(): Promise<Category[]> {
  const { data } = await fetchJson<{
    categories?: Category[];
    all?: Category[];
  }>("/categories", 300);
  return data?.all ?? data?.categories ?? [];
}

const titleCase = (slug: string) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatKES = (value: string) =>
  `KES ${Number(value).toLocaleString("en-KE")}`;

function describePage(query: ProductQuery, categories: Category[]) {
  const category = categories.find((c) => c.slug === query.category);
  const categoryName = query.category
    ? (category?.name ?? titleCase(query.category))
    : "";

  if (query.search) {
    return {
      title: `Search results for \u201C${query.search}\u201D`,
      subtitle: "Products matching your search",
      categoryName,
    };
  }
  if (categoryName) {
    return {
      title: categoryName,
      subtitle:
        category?.description || "Discover our collection of premium furniture",
      categoryName,
    };
  }
  if (query.sale) {
    return {
      title: "Hot Deals",
      subtitle: "Great prices on selected pieces",
      categoryName,
    };
  }
  if (query.featured) {
    return {
      title: "Featured Products",
      subtitle: "Hand-picked pieces from our collection",
      categoryName,
    };
  }
  return {
    title: "All Products",
    subtitle: "Discover our collection of premium furniture",
    categoryName,
  };
}

function priceLabel(min: string, max: string) {
  if (min && max) return `${formatKES(min)} – ${formatKES(max)}`;
  if (max) return `Under ${formatKES(max)}`;
  return `Over ${formatKES(min)}`;
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const query = parseProductQuery(await searchParams);
  const categories = await getCategories();
  const { title, subtitle } = describePage(query, categories);

  // Keep search/price/sort variations out of search engines
  const isVariation = Boolean(
    query.search ||
    query.minPrice ||
    query.maxPrice ||
    query.sort ||
    query.sale ||
    query.inStock,
  );

  return {
    title: `${title} | Sailex Furnitures`,
    description: subtitle,
    ...(isVariation && { robots: { index: false, follow: true } }),
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const query = parseProductQuery(await searchParams);
  const categories = await getCategories();
  const { title, subtitle, categoryName } = describePage(query, categories);

  // Removable chips for every active filter
  const chips: { label: string; href: string }[] = [];
  if (query.search) {
    chips.push({
      label: `Search: \u201C${query.search}\u201D`,
      href: productsHref(query, { search: "" }),
    });
  }
  if (categoryName) {
    chips.push({
      label: categoryName,
      href: productsHref(query, { category: "" }),
    });
  }
  if (query.minPrice || query.maxPrice) {
    chips.push({
      label: priceLabel(query.minPrice, query.maxPrice),
      href: productsHref(query, { minPrice: "", maxPrice: "" }),
    });
  }
  if (query.sale) {
    chips.push({
      label: "On sale",
      href: productsHref(query, { sale: false }),
    });
  }
  if (query.inStock) {
    chips.push({
      label: "In stock",
      href: productsHref(query, { inStock: false }),
    });
  }
  if (query.featured) {
    chips.push({
      label: "Featured",
      href: productsHref(query, { featured: false }),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            {title === "All Products" ? (
              <span className="text-foreground">Products</span>
            ) : (
              <>
                <Link href="/products" className="hover:text-foreground">
                  Products
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{title}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-4">
          <h1 className="mb-1 text-2xl font-bold text-foreground md:text-3xl">
            {title}
          </h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </header>

        {chips.length > 0 && (
          <ul className="mb-6 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <li key={chip.label}>
                <Link
                  href={chip.href}
                  aria-label={`Remove filter: ${chip.label}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm text-foreground transition-colors hover:bg-secondary/70"
                >
                  {chip.label}
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
            {activeFilterCount(query) > 1 && (
              <li>
                <Link
                  href="/products"
                  className="px-2 text-sm text-accent hover:underline"
                >
                  Clear all
                </Link>
              </li>
            )}
          </ul>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar filters - desktop */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto rounded-lg border border-border bg-card p-4">
              <ProductFilters query={query} categories={categories} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* Filters drawer - mobile */}
            <div className="mb-4 lg:hidden">
              <MobileFilters query={query} categories={categories} />
            </div>

            {/* Re-keyed on every URL change so the skeleton shows while loading */}
            <Suspense
              key={productsHref(query, { page: query.page })}
              fallback={<ProductsGridSkeleton />}
            >
              <ProductsResults query={query} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
