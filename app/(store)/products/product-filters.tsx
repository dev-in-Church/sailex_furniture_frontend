"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import useSWR from "swr";
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fallback categories when backend is not available
const fallbackCategories = [
  { id: "1", name: "Living Room", slug: "living-room", product_count: 24 },
  { id: "2", name: "Bedroom", slug: "bedroom", product_count: 18 },
  { id: "3", name: "Dining", slug: "dining", product_count: 12 },
  { id: "4", name: "Office", slug: "office", product_count: 15 },
  { id: "5", name: "Outdoor", slug: "outdoor", product_count: 8 },
  { id: "6", name: "Kids", slug: "kids", product_count: 10 },
];

const priceRanges = [
  { label: "Under KES 25,000", min: "0", max: "2500000" },
  { label: "KES 25,000 - 50,000", min: "2500000", max: "5000000" },
  { label: "KES 50,000 - 100,000", min: "5000000", max: "10000000" },
  { label: "Over KES 100,000", min: "10000000", max: "" },
];

interface Category {
  id: string;
  name: string;
  slug: string;
  product_count?: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
  });

  const currentCategory = searchParams.get("category") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";

  // Fetch categories from API
  const { data: categoriesData } = useSWR(`${API_URL}/categories`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const categories: Category[] =
    categoriesData?.all || categoriesData?.categories || fallbackCategories;

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.delete("page"); // Reset to page 1 when filtering

    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setSearch("");
    startTransition(() => {
      router.push("/products");
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const toggleSection = (section: "categories" | "price") => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasFilters =
    searchParams.has("category") ||
    searchParams.has("search") ||
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice");

  const activeFiltersCount = [
    searchParams.has("category"),
    searchParams.has("search"),
    searchParams.has("minPrice") || searchParams.has("maxPrice"),
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-foreground" />
          <span className="font-medium text-foreground">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-accent hover:underline"
            disabled={isPending}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="pb-4 border-b border-border">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isPending}
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Categories */}
      <div className="border-b border-border pb-4">
        <button
          onClick={() => toggleSection("categories")}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="font-medium text-foreground">Categories</span>
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expandedSections.categories && (
          <div className="space-y-1">
            <button
              onClick={() => updateFilters({ category: "" })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                !currentCategory
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              disabled={isPending}
            >
              <span>All Categories</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => updateFilters({ category: category.slug })}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  currentCategory === category.slug
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                disabled={isPending}
              >
                <span>{category.name}</span>
                {category.product_count !== undefined && (
                  <span className="text-xs opacity-60">
                    ({category.product_count})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border-b border-border pb-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="font-medium text-foreground">Price Range</span>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expandedSections.price && (
          <div className="space-y-1">
            <button
              onClick={() => updateFilters({ minPrice: "", maxPrice: "" })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !currentMinPrice && !currentMaxPrice
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              disabled={isPending}
            >
              Any Price
            </button>
            {priceRanges.map((range) => {
              const isSelected =
                currentMinPrice === range.min && currentMaxPrice === range.max;

              return (
                <button
                  key={range.label}
                  onClick={() =>
                    updateFilters({ minPrice: range.min, maxPrice: range.max })
                  }
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  disabled={isPending}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear Filters Button (Mobile) */}
      {hasFilters && (
        <Button
          variant="outline"
          className="w-full gap-2 lg:hidden"
          onClick={clearFilters}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}

export function ProductFiltersSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}
