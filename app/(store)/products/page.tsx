import { Suspense } from "react";
import { ProductsGrid } from "./products-grid";
import { ProductFilters, ProductFiltersSkeleton } from "./product-filters";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "All Products | Sailex Furnitures",
  description: "Browse our complete collection of premium furniture for your home and office",
};

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    sort?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

function ProductsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  return (
    <div className="bg-background min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="text-sm text-muted-foreground">
            <a href="/" className="hover:text-foreground">
              Home
            </a>
            <span className="mx-2">/</span>
            <span className="text-foreground">
              {params.search
                ? `Search results for "${params.search}"`
                : params.category
                ? params.category
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")
                : "All Products"}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {params.search
              ? `Search: "${params.search}"`
              : params.category
              ? params.category
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")
              : "All Products"}
          </h1>
          <p className="text-muted-foreground">
            Discover our collection of premium furniture
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-4 bg-card rounded-lg border border-border p-4">
              <Suspense fallback={<ProductFiltersSkeleton />}>
                <ProductFilters />
              </Suspense>
            </div>
          </aside>

          {/* Mobile Filters Toggle */}
          <div className="lg:hidden">
            <details className="bg-card rounded-lg border border-border">
              <summary className="px-4 py-3 cursor-pointer font-medium text-foreground flex items-center justify-between">
                <span>Filters & Search</span>
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-4 pb-4">
                <Suspense fallback={<ProductFiltersSkeleton />}>
                  <ProductFilters />
                </Suspense>
              </div>
            </details>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <Suspense fallback={<ProductsLoadingSkeleton />}>
              <ProductsGrid />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
