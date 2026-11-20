import Link from "next/link";
import Image from "next/image";
import type { ElementType } from "react";
import {
  ArrowRight,
  Armchair,
  BedDouble,
  Briefcase,
  DoorOpen,
  Lamp,
  Shield,
  Sofa,
  Truck,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category, Product } from "@/lib/api";
import { HeroSlider, type Banner } from "@/components/home/hero-slider";
import { ProductSlider } from "@/components/home/product-slider";

// Rendered on the server and cached for a minute, so visitors never wait on
// the API/database round trip and search engines see real content.
export const revalidate = 60;

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const FETCH_TIMEOUT_MS = 15_000;
const SLIDER_SIZE = 10;
const MAX_CATEGORY_TILES = 6;
const MAX_CATEGORY_SECTIONS = 3;

const banners: Banner[] = [
  {
    id: 1,
    image: "/images/banners/1.png",
    alt: "Premium furniture, up to 50% off",
    href: "/products?category=living-room",
  },
  {
    id: 2,
    image: "/images/banners/2.png",
    alt: "New arrivals: the latest bedroom furniture",
    href: "/products?category=bedroom",
  },
  {
    id: 3,
    image: "/images/banners/3.png",
    alt: "Free delivery on orders above KES 50,000",
    href: "/products?category=dining",
  },
];

const categoryIcons: Record<string, ElementType> = {
  "living-room": Sofa,
  bedroom: BedDouble,
  dining: UtensilsCrossed,
  office: Briefcase,
  outdoor: DoorOpen,
  storage: Lamp,
};

// Colored rings around the category circles
const RING_COLORS = [
  "border-orange-400",
  "border-violet-400",
  "border-sky-500",
  "border-amber-400",
  "border-emerald-500",
  "border-rose-400",
];

const trustPoints = [
  { icon: Truck, title: "Free delivery", text: "On orders above KES 50,000" },
  { icon: Wallet, title: "Pay with M-Pesa", text: "Quick, familiar checkout" },
  {
    icon: Shield,
    title: "Secure checkout",
    text: "Your details stay protected",
  },
];

export const metadata = {
  description:
    "Shop sofas, beds, dining sets and office furniture from Sailex Furniture.",
};

/* ----------------------------- data helpers ----------------------------- */

async function getJson<T>(path: string): Promise<T | null> {
  if (!API_BASE) {
    console.error("NEXT_PUBLIC_API_URL is not set");
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`GET ${path} failed with ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`GET ${path} failed:`, err);
    return null;
  }
}

const bySortOrder = (a: Category, b: Category) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0);

const discountPercent = (p: Product) => {
  const price = Number(p.price);
  const compare = Number(p.compare_at_price);
  return compare > price ? Math.round((1 - price / compare) * 100) : 0;
};

/** Groups products under their top-level category (children roll up to the parent). */
function buildCategorySections(categories: Category[], products: Product[]) {
  const byId = new Map(categories.map((c) => [c.id, c]));

  const rootIdOf = (category: Category) => {
    let current = category;
    const seen = new Set<string>();
    while (current.parent_id && !seen.has(current.id)) {
      seen.add(current.id);
      const parent = byId.get(current.parent_id);
      if (!parent) break;
      current = parent;
    }
    return current.id;
  };

  const grouped = new Map<string, Product[]>();
  for (const product of products) {
    const category = product.category_id
      ? byId.get(product.category_id)
      : undefined;
    if (!category) continue;
    const rootId = rootIdOf(category);
    const list = grouped.get(rootId) ?? [];
    list.push(product);
    grouped.set(rootId, list);
  }

  return categories
    .filter((c) => !c.parent_id)
    .sort(bySortOrder)
    .map((category) => ({
      category,
      products: (grouped.get(category.id) ?? []).slice(0, SLIDER_SIZE),
    }))
    .filter((section) => section.products.length > 0)
    .slice(0, MAX_CATEGORY_SECTIONS);
}

/* --------------------------------- page --------------------------------- */

export default async function HomePage() {
  const [productsData, featuredData, categoriesData] = await Promise.all([
    getJson<{ products?: Product[] }>("/products?limit=40"),
    getJson<{ products?: Product[] }>(
      `/products/featured?limit=${SLIDER_SIZE}`,
    ),
    getJson<{ categories?: Category[]; all?: Category[] }>("/categories"),
  ]);

  const products = productsData?.products ?? [];
  const featured = (featuredData?.products ?? []).slice(0, SLIDER_SIZE);
  const categories = categoriesData?.all ?? categoriesData?.categories ?? [];

  const topCategories = categories
    .filter((c) => !c.parent_id)
    .sort(bySortOrder);
  const categoryTiles = topCategories.slice(0, MAX_CATEGORY_TILES);

  const newArrivals = [...products]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, SLIDER_SIZE);

  const hotDeals = products
    .filter((p) => discountPercent(p) > 0)
    .sort((a, b) => discountPercent(b) - discountPercent(a))
    .slice(0, SLIDER_SIZE);
  const biggestDiscount = hotDeals.reduce(
    (max, p) => Math.max(max, discountPercent(p)),
    0,
  );

  const categorySections = buildCategorySections(categories, products);

  const hasNothingToShow = products.length === 0 && featured.length === 0;

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
        <HeroSlider banners={banners} />

        {hasNothingToShow && (
          <div className="mb-6 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <h2 className="text-lg font-bold text-foreground">
              Our catalogue is being updated
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We couldn&apos;t load products right now. Please try again in a
              moment.
            </p>
            <Link href="/products" className="mt-4 inline-block">
              <Button variant="outline">Browse all products</Button>
            </Link>
          </div>
        )}

        {/* Red deals strip, like Jumia's Flash Sales */}
        <ProductSlider
          title="Hot Deals"
          subtitle={
            biggestDiscount > 0 ? `Up to ${biggestDiscount}% off` : undefined
          }
          products={hotDeals}
          viewAllHref="/products?sale=true"
          variant="deals"
        />

        {/* Category circles */}
        {categoryTiles.length > 0 && (
          <section className="mb-8" aria-labelledby="shop-by-category">
            <h2
              id="shop-by-category"
              className="mb-4 text-xl font-extrabold text-foreground sm:text-2xl"
            >
              Shop by Category
            </h2>
            <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
              {categoryTiles.map((category, index) => {
                const Icon = categoryIcons[category.slug] ?? Armchair;
                return (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="group flex flex-col items-center gap-3 text-center"
                    >
                      <span
                        className={`relative flex aspect-square w-full max-w-[170px] items-center justify-center overflow-hidden rounded-full border-[3px] bg-accent/5 transition-transform group-hover:scale-105 ${
                          RING_COLORS[index % RING_COLORS.length]
                        }`}
                      >
                        {category.image_url ? (
                          <Image
                            src={category.image_url}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 170px"
                            className="object-cover"
                          />
                        ) : (
                          <Icon
                            className="h-1/3 w-1/3 text-accent"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span className="text-sm font-semibold text-foreground sm:text-base">
                        {category.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <ProductSlider
          title="Featured"
          subtitle="Hand-picked for you"
          products={featured}
          viewAllHref="/products?featured=true"
          variant="tinted"
        />

        <ProductSlider
          title="New Arrivals"
          subtitle="Fresh in store"
          products={newArrivals}
          viewAllHref="/products?sort=newest"
        />

        {categorySections.map(({ category, products: items }, index) => (
          <ProductSlider
            key={category.id}
            title={category.name}
            products={items}
            viewAllHref={`/categories/${category.slug}`}
            variant={index % 2 === 0 ? "tinted" : "plain"}
          />
        ))}

        {/* Reassurance row */}
        <ul className="mb-6 grid gap-3 sm:grid-cols-3">
          {trustPoints.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-border"
            >
              <span className="rounded-full bg-accent/10 p-2">
                <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mb-6 text-center">
          <Link href="/products">
            <Button size="lg" className="gap-2 px-8">
              Shop All Products <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
