import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategory, getCategoryProducts, type Category, type Product } from "@/lib/api";

// Mock data
const mockCategories: Record<string, Category> = {
  "living-room": { id: "1", name: "Living Room", slug: "living-room", description: "Comfortable and stylish furniture for your living space", image_url: "/images/hero-living-room.jpg", parent_id: null, parent_name: null, sort_order: 1, product_count: 25 },
  "bedroom": { id: "2", name: "Bedroom", slug: "bedroom", description: "Rest in style with our bedroom furniture collection", image_url: "/images/hero-living-room.jpg", parent_id: null, parent_name: null, sort_order: 2, product_count: 18 },
  "dining": { id: "3", name: "Dining", slug: "dining", description: "Elegant dining tables and chairs for memorable meals", image_url: "/images/hero-living-room.jpg", parent_id: null, parent_name: null, sort_order: 3, product_count: 12 },
  "office": { id: "4", name: "Office", slug: "office", description: "Professional furniture for your home office", image_url: "/images/hero-living-room.jpg", parent_id: null, parent_name: null, sort_order: 4, product_count: 15 },
};

const mockProducts: Product[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  name: ["Milano Leather Sofa", "Nordic Oak Coffee Table", "Cloud Comfort Bed", "Executive Office Chair", "Rustic Dining Table", "Velvet Accent Chair", "Standing Desk Pro", "Garden Lounge Set"][i],
  slug: ["milano-leather-sofa", "nordic-oak-coffee-table", "cloud-comfort-bed", "executive-office-chair", "rustic-dining-table", "velvet-accent-chair", "standing-desk-pro", "garden-lounge-set"][i],
  description: "Premium handcrafted furniture",
  price: String([89999, 24999, 67999, 34999, 129999, 19999, 54999, 95999][i]),
  compare_at_price: i % 2 === 0 ? String([109999, 29999, 79999, 39999, 149999, 24999, 64999, 119999][i]) : null,
  sku: `SKU-${i + 1}`,
  stock_quantity: 10 + i,
  category_id: "1",
  category_name: "Living Room",
  category_slug: "living-room",
  images: ["/images/hero-living-room.jpg"],
  specifications: {},
  featured: i < 4,
  status: "active",
  created_at: new Date().toISOString(),
}));

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = mockCategories[slug];
  
  return {
    title: category?.name || "Category",
    description: category?.description || "Browse our furniture collection",
  };
}

function ProductsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

async function CategoryProducts({ slug, page, sort }: { slug: string; page: number; sort?: string }) {
  let products: Product[] = mockProducts;
  let pagination = { page, limit: 12, total: 8, totalPages: 1 };

  try {
    const response = await getCategoryProducts(slug, {
      page: String(page),
      limit: "12",
      ...(sort && { sort }),
    });
    products = response.products;
    pagination = response.pagination;
  } catch (error) {
    console.error("Failed to fetch category products:", error);
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
        <p className="text-muted-foreground">
          Check back soon for new arrivals in this category
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {products.length} of {pagination.total} products
        </p>
        <select
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          defaultValue={sort || "created_at"}
        >
          <option value="created_at">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam, sort } = await searchParams;
  const page = parseInt(pageParam || "1");

  let category: Category | null = mockCategories[slug] || null;
  let subcategories: Category[] = [];

  try {
    const response = await getCategory(slug);
    category = response.category;
    subcategories = response.subcategories;
  } catch (error) {
    console.error("Failed to fetch category:", error);
    if (!mockCategories[slug]) {
      notFound();
    }
  }

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-2">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-muted-foreground max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href={`/categories/${slug}`}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-full text-sm font-medium"
          >
            All
          </Link>
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/categories/${sub.slug}`}
              className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground rounded-full text-sm font-medium transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Products */}
      <Suspense fallback={<ProductsLoadingSkeleton />}>
        <CategoryProducts slug={slug} page={page} sort={sort} />
      </Suspense>
    </div>
  );
}
