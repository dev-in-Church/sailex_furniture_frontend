"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import {
  ChevronRight,
  ChevronLeft,
  Truck,
  Shield,
  Headphones,
  Star,
  ArrowRight,
  Sofa,
  BedDouble,
  UtensilsCrossed,
  Briefcase,
  Lamp,
  DoorOpen,
  Loader2,
  Wallet,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Product, type Category } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Mock data for fallback when backend is not available
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Milano Leather Sofa",
    slug: "milano-leather-sofa",
    description: "Luxurious Italian-inspired leather sofa",
    price: "89999",
    compare_at_price: "129999",
    sku: "SOF-MIL-001",
    stock_quantity: 15,
    category_id: "1",
    category_name: "Living Room",
    category_slug: "living-room",
    images: ["/images/products/sofa-1.jpg"],
    specifications: {},
    featured: true,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Nordic Oak Coffee Table",
    slug: "nordic-oak-coffee-table",
    description: "Minimalist Scandinavian-style coffee table",
    price: "24999",
    compare_at_price: "34999",
    sku: "TBL-NRD-001",
    stock_quantity: 25,
    category_id: "1",
    category_name: "Living Room",
    category_slug: "living-room",
    images: ["/images/products/dining-1.jpg"],
    specifications: {},
    featured: true,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Cloud Comfort Bed Frame",
    slug: "cloud-comfort-bed-frame",
    description: "Modern upholstered bed frame",
    price: "67999",
    compare_at_price: "89999",
    sku: "BED-CLD-001",
    stock_quantity: 10,
    category_id: "2",
    category_name: "Bedroom",
    category_slug: "bedroom",
    images: ["/images/products/bed-1.jpg"],
    specifications: {},
    featured: true,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Executive Office Chair",
    slug: "executive-office-chair",
    description: "Premium ergonomic office chair",
    price: "34999",
    compare_at_price: "49999",
    sku: "CHR-EXC-001",
    stock_quantity: 30,
    category_id: "4",
    category_name: "Office",
    category_slug: "office",
    images: ["/images/products/chair-1.jpg"],
    specifications: {},
    featured: true,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Velvet Accent Chair",
    slug: "velvet-accent-chair",
    description: "Elegant velvet accent chair",
    price: "29999",
    compare_at_price: "39999",
    sku: "CHR-VLV-001",
    stock_quantity: 20,
    category_id: "1",
    category_name: "Living Room",
    category_slug: "living-room",
    images: ["/images/products/sofa-1.jpg"],
    specifications: {},
    featured: false,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Wooden Dining Set",
    slug: "wooden-dining-set",
    description: "6-seater dining table with chairs",
    price: "119999",
    compare_at_price: "159999",
    sku: "DIN-WD-001",
    stock_quantity: 8,
    category_id: "3",
    category_name: "Dining",
    category_slug: "dining",
    images: ["/images/products/dining-1.jpg"],
    specifications: {},
    featured: true,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "7",
    name: "King Size Memory Foam Mattress",
    slug: "king-memory-foam-mattress",
    description: "Premium memory foam mattress",
    price: "54999",
    compare_at_price: "74999",
    sku: "MAT-KNG-001",
    stock_quantity: 12,
    category_id: "2",
    category_name: "Bedroom",
    category_slug: "bedroom",
    images: ["/images/products/bed-1.jpg"],
    specifications: {},
    featured: false,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Modern TV Stand",
    slug: "modern-tv-stand",
    description: "Contemporary TV stand with storage",
    price: "32999",
    compare_at_price: "44999",
    sku: "TVS-MOD-001",
    stock_quantity: 18,
    category_id: "1",
    category_name: "Living Room",
    category_slug: "living-room",
    images: ["/images/products/sofa-1.jpg"],
    specifications: {},
    featured: false,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "9",
    name: "Minimalist Bookshelf",
    slug: "minimalist-bookshelf",
    description: "Modern 5-tier bookshelf",
    price: "18999",
    compare_at_price: null,
    sku: "BKS-MIN-001",
    stock_quantity: 14,
    category_id: "6",
    category_name: "Storage",
    category_slug: "storage",
    images: ["/images/products/sofa-1.jpg"],
    specifications: {},
    featured: false,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "10",
    name: "Patio Lounge Set",
    slug: "patio-lounge-set",
    description: "Weather-resistant outdoor furniture set",
    price: "45999",
    compare_at_price: "59999",
    sku: "OUT-PAT-001",
    stock_quantity: 6,
    category_id: "5",
    category_name: "Outdoor",
    category_slug: "outdoor",
    images: ["/images/hero-living-room.jpg"],
    specifications: {},
    featured: false,
    status: "active",
    created_at: new Date().toISOString(),
  },
];

const mockCategories: Category[] = [
  {
    id: "1",
    name: "Living Room",
    slug: "living-room",
    description: null,
    image_url: "/images/products/sofa-1.jpg",
    parent_id: null,
    parent_name: null,
    sort_order: 1,
    product_count: 45,
  },
  {
    id: "2",
    name: "Bedroom",
    slug: "bedroom",
    description: null,
    image_url: "/images/products/bed-1.jpg",
    parent_id: null,
    parent_name: null,
    sort_order: 2,
    product_count: 38,
  },
  {
    id: "3",
    name: "Dining",
    slug: "dining",
    description: null,
    image_url: "/images/products/dining-1.jpg",
    parent_id: null,
    parent_name: null,
    sort_order: 3,
    product_count: 24,
  },
  {
    id: "4",
    name: "Office",
    slug: "office",
    description: null,
    image_url: "/images/products/chair-1.jpg",
    parent_id: null,
    parent_name: null,
    sort_order: 4,
    product_count: 32,
  },
  {
    id: "5",
    name: "Outdoor",
    slug: "outdoor",
    description: null,
    image_url: "/images/hero-living-room.jpg",
    parent_id: null,
    parent_name: null,
    sort_order: 5,
    product_count: 18,
  },
  {
    id: "6",
    name: "Storage",
    slug: "storage",
    description: null,
    image_url: "/images/hero-living-room.jpg",
    parent_id: null,
    parent_name: null,
    sort_order: 6,
    product_count: 22,
  },
];

const banners = [
  {
    id: 1,
    image: "/images/banners/banner.png",
    title: "Premium Furniture",
    subtitle: "Up to 50% Off",
    description: "Luxury sofas and living room furniture",
    link: "/products?sale=true",
    color: "from-amber-900/90",
  },
  {
    id: 2,
    image: "/images/banners/banner.png",
    title: "New Arrivals",
    subtitle: "2024 Collection",
    description: "Discover the latest bedroom furniture",
    link: "/categories/bedroom",
    color: "from-stone-900/90",
  },
  {
    id: 3,
    image: "/images/banners/banner.png",
    title: "Free Delivery",
    subtitle: "On Orders Above KES 50,000",
    description: "Shop now and save on shipping",
    link: "/products",
    color: "from-primary/90",
  },
];

const categoryIcons: Record<string, React.ElementType> = {
  "living-room": Sofa,
  bedroom: BedDouble,
  dining: UtensilsCrossed,
  office: Briefcase,
  outdoor: DoorOpen,
  storage: Lamp,
};

// Product Slider Component
function ProductSlider({
  title,
  products,
  isLoading,
  viewAllLink,
  accentColor = "accent",
}: {
  title: string;
  products: Product[];
  isLoading: boolean;
  viewAllLink: string;
  accentColor?: string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(
        container.scrollLeft + container.clientWidth <
          container.scrollWidth - 10,
      );
    }
  };

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = isMobile ? 280 : 320;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      checkScroll();
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, [products]);

  const getCardsPerView = () => {
    if (typeof window === "undefined") return 5;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    if (window.innerWidth < 1280) return 4;
    return 5;
  };

  return (
    <section className="bg-card rounded-lg border border-border mb-6 overflow-hidden">
      <div
        className={`px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 ${
          accentColor === "primary" ? "bg-primary/5" : ""
        }`}
      >
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <Link
          href={viewAllLink}
          className="text-accent text-sm font-medium hover:underline flex items-center gap-1"
        >
          See All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="relative group">
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg border border-border transition-all hidden sm:flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide gap-4 p-4 snap-x snap-mandatory"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {isLoading
            ? [...Array(getCardsPerView())].map((_, i) => (
                <div
                  key={i}
                  className="flex-none w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] min-w-[200px] snap-start"
                >
                  <ProductCardSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div
                  key={product.id}
                  className="flex-none w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] min-w-[200px] snap-start"
                >
                  <ProductCardCompact product={product} />
                </div>
              ))}
        </div>
        {showRightArrow && products.length > getCardsPerView() && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg border border-border transition-all hidden sm:flex items-center justify-center"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        )}
      </div>
    </section>
  );
}

function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[200px] md:h-[350px] aspect-auto rounded-sm overflow-hidden">
      {banners.map((banner, index) => (
        <Link
          key={banner.id}
          href={banner.link}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-cover]"
            priority={index === 0}
          />
        </Link>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentSlide ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() =>
          setCurrentSlide(
            (prev) => (prev - 1 + banners.length) % banners.length,
          )
        }
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function ProductCardCompact({ product }: { product: Product }) {
  const hasDiscount =
    product.compare_at_price &&
    parseFloat(product.compare_at_price) > parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(
        (1 -
          parseFloat(product.price) / parseFloat(product.compare_at_price!)) *
          100,
      )
    : 0;

  const [imgSrc, setImgSrc] = useState(
    product.images?.[0] || "/placeholder.png",
  );

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-card rounded-lg border border-border hover:shadow-lg transition-shadow h-full"
    >
      <div className="relative aspect-square">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className="object-cover rounded-t-lg"
          onError={() => {
            if (imgSrc !== "/placeholder.png") {
              setImgSrc("/placeholder.png");
            }
          }}
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-accent text-accent-foreground text-xs font-bold rounded">
            -{discountPercent}%
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">
          {product.name}
        </h3>
        <div className="mt-2">
          <span className="text-base font-bold text-primary">
            KES {parseInt(product.price).toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="ml-2 text-xs text-muted-foreground line-through">
              KES {parseInt(product.compare_at_price!).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < 4 ? "fill-amber-400 text-amber-400" : "text-muted"}`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">(24)</span>
        </div>
      </div>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border animate-pulse h-full">
      <div className="aspect-square bg-muted rounded-t-lg" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
}

export default function HomePage() {
  // Fetch products from API
  const { data: productsData, isLoading: productsLoading } = useSWR(
    `${API_BASE}/products?limit=20`,
    fetcher,
    {
      fallbackData: { products: mockProducts },
      revalidateOnFocus: false,
      onError: () => {
        // Silently fall back to mock data on error
      },
    },
  );

  // Fetch featured products
  const { data: featuredData, isLoading: featuredLoading } = useSWR(
    `${API_BASE}/products/featured`,
    fetcher,
    {
      fallbackData: { products: mockProducts.filter((p) => p.featured) },
      revalidateOnFocus: false,
    },
  );

  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useSWR(
    `${API_BASE}/categories`,
    fetcher,
    {
      fallbackData: { categories: mockCategories },
      revalidateOnFocus: false,
    },
  );

  const products: Product[] = productsData?.products || mockProducts;
  const featuredProducts: Product[] =
    featuredData?.products || mockProducts.filter((p) => p.featured);
  const categories: Category[] =
    categoriesData?.categories || categoriesData?.all || mockCategories;

  // Filter products for different sections
  const bestSellerProducts = products.slice(0, 10);
  const newArrivalsProducts = [...products].reverse().slice(0, 10);
  const saleProducts = products.filter(
    (p) =>
      p.compare_at_price &&
      parseFloat(p.compare_at_price) > parseFloat(p.price),
  );

  // Group products by category for category sections
  const livingRoomProducts = products.filter(
    (p) =>
      p.category_slug === "living-room" ||
      p.category_name?.toLowerCase().includes("living"),
  );
  const bedroomProducts = products.filter(
    (p) =>
      p.category_slug === "bedroom" ||
      p.category_name?.toLowerCase().includes("bedroom"),
  );
  const diningProducts = products.filter(
    (p) =>
      p.category_slug === "dining" ||
      p.category_name?.toLowerCase().includes("dining"),
  );
  const officeProducts = products.filter(
    (p) =>
      p.category_slug === "office" ||
      p.category_name?.toLowerCase().includes("office"),
  );

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-4">
        {/* Main Hero Section with Categories */}
        <div className="flex gap-4 mb-6">
          {/* Categories Sidebar - Desktop */}
          <div className="hidden lg:flex w-56 shrink-0">
            <div className="bg-card rounded-sm overflow-hidden w-full">
              <div className="bg-primary text-primary-foreground px-4 py-3 font-semibold">
                Categories
              </div>
              <nav className="py-2">
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  categories.map((category) => {
                    const Icon = categoryIcons[category.slug] || Sofa;
                    return (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary hover:text-accent transition-colors"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{category.name}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </Link>
                    );
                  })
                )}
              </nav>
            </div>
          </div>

          {/* Hero Slider */}
          <div className="flex-1">
            <HeroSlider />
          </div>

          {/* Side Banner - Desktop */}
          <div className="hidden lg:flex w-60 border overflow-hidden border-primary rounded-sm">
            <Image
              src="/placeholder.png"
              alt="Sailex Furnitures"
              width={100}
              height={50}
              className="h-full w-auto object-cover object-center"
            />
          </div>
        </div>

        {/* Best Sellers Slider */}
        <ProductSlider
          title="Best Sellers"
          products={bestSellerProducts}
          isLoading={productsLoading}
          viewAllLink="/products?sort=popular"
        />

        {/* New Arrivals Slider */}
        <ProductSlider
          title="New Arrivals"
          products={newArrivalsProducts}
          isLoading={productsLoading}
          viewAllLink="/products?sort=newest"
        />

        {/* Categories Grid - Mobile */}
        <section className="lg:hidden mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Shop by Category
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {categories.slice(0, 6).map((category) => {
              const Icon = categoryIcons[category.slug] || Sofa;
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="flex flex-col items-center gap-2 p-4 bg-card rounded-lg border border-border hover:border-accent transition-colors"
                >
                  <div className="p-3 bg-accent/10 rounded-full">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Living Room Furniture Slider */}
        <ProductSlider
          title="Living Room Furniture"
          products={
            livingRoomProducts.length > 0 ? livingRoomProducts : products
          }
          isLoading={productsLoading}
          viewAllLink="/categories/living-room"
        />

        {/* Bedroom Furniture Slider */}
        <ProductSlider
          title="Bedroom Furniture"
          products={bedroomProducts.length > 0 ? bedroomProducts : products}
          isLoading={productsLoading}
          viewAllLink="/categories/bedroom"
        />

        {/* Dining Room Furniture Slider */}
        <ProductSlider
          title="Dining Room Furniture"
          products={diningProducts.length > 0 ? diningProducts : products}
          isLoading={productsLoading}
          viewAllLink="/categories/dining"
        />

        {/* Office Furniture Slider */}
        <ProductSlider
          title="Office Furniture"
          products={officeProducts.length > 0 ? officeProducts : products}
          isLoading={productsLoading}
          viewAllLink="/categories/office"
        />

        {/* Sale Products Slider */}
        {saleProducts.length > 0 && (
          <ProductSlider
            title="Special Offers"
            products={saleProducts}
            isLoading={productsLoading}
            viewAllLink="/products?sale=true"
            accentColor="primary"
          />
        )}

        {/* Featured Products Slider */}
        <ProductSlider
          title="Featured Products"
          products={featuredProducts}
          isLoading={featuredLoading}
          viewAllLink="/products?featured=true"
        />

        {/* Shop All Products CTA */}
        <div className="text-center mb-6">
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
