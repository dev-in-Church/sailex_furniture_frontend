"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Mock products for demo when backend is not available
const mockProducts = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: [
    "Milano Leather Sofa",
    "Nordic Oak Coffee Table",
    "Cloud Comfort Bed",
    "Executive Office Chair",
    "Rustic Dining Table",
    "Velvet Accent Chair",
    "Modern Bookshelf",
    "Outdoor Lounge Set",
    "Kids Bunk Bed",
    "Glass Console Table",
    "Recliner Armchair",
    "Wooden TV Stand",
  ][i % 12],
  slug: [
    "milano-leather-sofa",
    "nordic-oak-coffee-table",
    "cloud-comfort-bed",
    "executive-office-chair",
    "rustic-dining-table",
    "velvet-accent-chair",
    "modern-bookshelf",
    "outdoor-lounge-set",
    "kids-bunk-bed",
    "glass-console-table",
    "recliner-armchair",
    "wooden-tv-stand",
  ][i % 12],
  description: "Premium handcrafted furniture for your home",
  price: String(
    [
      89999, 24999, 67999, 34999, 129999, 19999, 45999, 159999, 55999, 32999,
      49999, 27999,
    ][i % 12],
  ),
  compare_at_price:
    i % 3 === 0
      ? String(
          [
            109999, 29999, 79999, 39999, 149999, 24999, 55999, 189999, 69999,
            39999, 59999, 34999,
          ][i % 12],
        )
      : null,
  sku: `SKU-00${i + 1}`,
  stock_quantity: 10 + i,
  category_id: String((i % 6) + 1),
  category_name: [
    "Living Room",
    "Bedroom",
    "Dining",
    "Office",
    "Outdoor",
    "Kids",
  ][i % 6],
  category_slug: [
    "living-room",
    "bedroom",
    "dining",
    "office",
    "outdoor",
    "kids",
  ][i % 6],
  images: [
    `/images/products/${["sofa-1", "bed-1", "dining-1", "chair-1"][i % 4]}.jpg`,
  ],
  specifications: {},
  featured: i < 4,
  status: "active",
  created_at: new Date().toISOString(),
}));

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  stock_quantity: number;
  category_name: string | null;
  category_slug: string | null;
  images: string[];
  featured: boolean;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

function ProductCard({ product }: { product: Product }) {
  const { addToCart, isLoading } = useCart();
  const hasDiscount =
    product.compare_at_price &&
    parseFloat(product.compare_at_price) > parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((parseFloat(product.compare_at_price!) - parseFloat(product.price)) /
          parseFloat(product.compare_at_price!)) *
          100,
      )
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1, {
      name: product.name,
      slug: product.slug,
      price: product.price,
      images: product.images,
      stock_quantity: product.stock_quantity,
    });
  };

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-card rounded-lg border border-border overflow-hidden transition-shadow hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-square bg-secondary">
          <Image
            src={product.images[0] || "/images/hero-living-room.jpg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discountPercent}%
            </span>
          )}
          {product.stock_quantity < 5 && product.stock_quantity > 0 && (
            <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded">
              Low Stock
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-4">
          {product.category_name && (
            <p className="text-xs text-muted-foreground mb-1">
              {product.category_name}
            </p>
          )}
          <h3 className="font-medium text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-primary">
              {formatPrice(parseFloat(product.price))}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(parseFloat(product.compare_at_price!))}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={handleAddToCart}
            disabled={isLoading || product.stock_quantity === 0}
          >
            <ShoppingCart className="h-4 w-4" />
            {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </Link>
  );
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

export function ProductsGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Build query string from search params
  const queryParams = new URLSearchParams();
  const page = searchParams.get("page") || "1";
  const category = searchParams.get("category");
  const sort = searchParams.get("sort");
  const search = searchParams.get("search");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  queryParams.set("page", page);
  queryParams.set("limit", "12");
  if (category) queryParams.set("category", category);
  if (sort) queryParams.set("sort", sort);
  if (search) queryParams.set("search", search);
  if (minPrice) queryParams.set("minPrice", minPrice);
  if (maxPrice) queryParams.set("maxPrice", maxPrice);

  const { data, error, isLoading } = useSWR(
    `${API_URL}/products?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  );

  // Use mock data if backend is not available
  let products: Product[] = mockProducts;
  let pagination = { page: 1, limit: 12, total: 12, totalPages: 1 };

  if (data && !error) {
    products = data.products;
    pagination = data.pagination;
  } else if (error) {
    // Filter mock data based on search params
    let filtered = [...mockProducts];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower),
      );
    }

    if (category) {
      filtered = filtered.filter((p) => p.category_slug === category);
    }

    if (minPrice) {
      filtered = filtered.filter(
        (p) => parseFloat(p.price) >= parseFloat(minPrice) * 100,
      );
    }

    if (maxPrice) {
      filtered = filtered.filter(
        (p) => parseFloat(p.price) <= parseFloat(maxPrice) * 100,
      );
    }

    if (sort) {
      if (sort === "price-asc") {
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      } else if (sort === "price-desc") {
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      } else if (sort === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    products = filtered;
    pagination = { page: 1, limit: 12, total: filtered.length, totalPages: 1 };
  }

  // Build pagination URLs
  const buildUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    if (search) params.set("search", search);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    return `/products?${params.toString()}`;
  };

  if (isLoading) {
    return <ProductsLoadingSkeleton />;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No products found
        </h3>
        <p className="text-muted-foreground mb-6">
          Try adjusting your search or filter criteria
        </p>
        <Link href="/products">
          <Button variant="outline">Clear All Filters</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Results Count & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{products.length}</span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {pagination.total}
          </span>{" "}
          products
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={sort || "created_at"}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("sort", e.target.value);
              params.delete("page");
              router.push(`/products?${params.toString()}`);
            }}
          >
            <option value="created_at">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name: A-Z</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          {parseInt(page) > 1 && (
            <Link href={buildUrl(parseInt(page) - 1)}>
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {Array.from(
            { length: Math.min(pagination.totalPages, 5) },
            (_, i) => {
              const pageNum = i + 1;
              return (
                <Link key={pageNum} href={buildUrl(pageNum)}>
                  <Button
                    variant={pageNum === parseInt(page) ? "default" : "outline"}
                    size="icon"
                  >
                    {pageNum}
                  </Button>
                </Link>
              );
            },
          )}

          {parseInt(page) < pagination.totalPages && (
            <Link href={buildUrl(parseInt(page) + 1)}>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
