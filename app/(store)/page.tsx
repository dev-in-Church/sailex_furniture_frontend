"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import useSWR from "swr";
import {
  ChevronRight,
  ChevronLeft,
  Zap,
  Truck,
  Shield,
  Headphones,
  Star,
  Clock,
  ArrowRight,
  Sofa,
  BedDouble,
  UtensilsCrossed,
  Briefcase,
  Lamp,
  DoorOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Product, type Category } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_UR;

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
    image: "/images/banners/flash-sale.jpg",
    title: "Flash Sale",
    subtitle: "Up to 50% Off",
    description: "Premium sofas and living room furniture",
    link: "/products?sale=true",
    color: "from-amber-900/90",
  },
  {
    id: 2,
    image: "/images/banners/new-arrivals.jpg",
    title: "New Arrivals",
    subtitle: "2024 Collection",
    description: "Discover the latest bedroom furniture",
    link: "/categories/bedroom",
    color: "from-stone-900/90",
  },
  {
    id: 3,
    image: "/images/hero-living-room.jpg",
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

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-1">
      <div className="bg-foreground text-background px-2 py-1 rounded text-sm font-bold min-w-[32px] text-center">
        {String(timeLeft.hours).padStart(2, "0")}
      </div>
      <span className="text-foreground font-bold">:</span>
      <div className="bg-foreground text-background px-2 py-1 rounded text-sm font-bold min-w-[32px] text-center">
        {String(timeLeft.minutes).padStart(2, "0")}
      </div>
      <span className="text-foreground font-bold">:</span>
      <div className="bg-foreground text-background px-2 py-1 rounded text-sm font-bold min-w-[32px] text-center">
        {String(timeLeft.seconds).padStart(2, "0")}
      </div>
    </div>
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
    <div className="relative h-[300px] md:h-[350px] rounded-lg overflow-hidden">
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
            className="object-cover"
            priority={index === 0}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-r ${banner.color} to-transparent`}
          />
          <div className="absolute inset-0 flex items-center">
            <div className="px-8 md:px-12 max-w-lg">
              <span className="inline-block px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded mb-3">
                {banner.subtitle}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                {banner.title}
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-4">
                {banner.description}
              </p>
              <Button className="gap-2">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-card rounded-lg border border-border hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-square">
        <Image
          src={product.images?.[0] || "/images/hero-living-room.jpg"}
          alt={product.name}
          fill
          className="object-cover rounded-t-lg"
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
    <div className="bg-card rounded-lg border border-border animate-pulse">
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
  const flashSaleEndTime = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours from now

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

  // Filter products with discounts for flash sale
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

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Top Banner */}
      {/* <div className="bg-accent text-accent-foreground py-2 text-center text-sm font-medium">
        Free Delivery on orders above KES 50,000 | Use code SAILEX10 for 10% off
      </div> */}

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

          {/* Side Banners - Desktop */}
          <div className="hidden lg:flex w-56 border-2 border-primary rounded-sm">
            <Image
              src="/logo.png"
              alt="Sailex Furnitures"
              width={100}
              height={50}
              className="h-full w-auto object-cover object-center"
            />
          </div>
        </div>

        {/* Features Bar */}
        {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon: Truck,
              title: "Free Delivery",
              desc: "Orders over KES 50K",
            },
            {
              icon: Shield,
              title: "2 Year Warranty",
              desc: "Quality guaranteed",
            },
            {
              icon: Headphones,
              title: "24/7 Support",
              desc: "Expert assistance",
            },
            { icon: Clock, title: "Easy Returns", desc: "30-day returns" },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex items-center gap-3 bg-card rounded-lg border border-border p-4"
            >
              <div className="p-2 bg-accent/10 rounded-lg">
                <feature.icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {feature.title}
                </p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div> */}

        {/* Flash Sale Section */}
        <section className="bg-card rounded-lg border border-border mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-accent to-amber-600 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-white fill-white" />
              <h2 className="text-lg font-bold text-white">Flash Sale</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/90 text-sm">Ends in:</span>
              <CountdownTimer targetDate={flashSaleEndTime} />
            </div>
            <Link
              href="/products?sale=true"
              className="text-white text-sm font-medium hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {productsLoading
                ? [...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)
                : (saleProducts.length > 0 ? saleProducts : products)
                    .slice(0, 5)
                    .map((product) => (
                      <ProductCardCompact key={product.id} product={product} />
                    ))}
            </div>
          </div>
        </section>

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

        {/* Top Deals Section */}
        <section className="bg-card rounded-lg border border-border mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Top Deals</h2>
            <Link
              href="/products?deals=true"
              className="text-accent text-sm font-medium hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {productsLoading
                ? [...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)
                : products
                    .slice(0, 5)
                    .map((product) => (
                      <ProductCardCompact key={product.id} product={product} />
                    ))}
            </div>
          </div>
        </section>

        {/* Living Room Furniture */}
        <section className="bg-card rounded-lg border border-border mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Living Room Furniture
            </h2>
            <Link
              href="/categories/living-room"
              className="text-accent text-sm font-medium hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {productsLoading
                ? [...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)
                : (livingRoomProducts.length > 0
                    ? livingRoomProducts
                    : products
                  )
                    .slice(0, 5)
                    .map((product) => (
                      <ProductCardCompact key={product.id} product={product} />
                    ))}
            </div>
          </div>
        </section>

        {/* Bedroom Furniture */}
        <section className="bg-card rounded-lg border border-border mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Bedroom Furniture
            </h2>
            <Link
              href="/categories/bedroom"
              className="text-accent text-sm font-medium hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {productsLoading
                ? [...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)
                : (bedroomProducts.length > 0 ? bedroomProducts : products)
                    .slice(0, 5)
                    .map((product) => (
                      <ProductCardCompact key={product.id} product={product} />
                    ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="bg-card rounded-lg border border-border mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Featured Products
            </h2>
            <Link
              href="/products?featured=true"
              className="text-accent text-sm font-medium hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {featuredLoading
                ? [...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)
                : featuredProducts
                    .slice(0, 5)
                    .map((product) => (
                      <ProductCardCompact key={product.id} product={product} />
                    ))}
            </div>
          </div>
        </section>

        {/* Shop All Products CTA */}
        <div className="text-center mb-6">
          <Link href="/products">
            <Button size="lg" className="gap-2 px-8">
              Shop All Products <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Shop by Room Banner */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              name: "Living Room",
              image: "/images/products/sofa-1.jpg",
              slug: "living-room",
            },
            {
              name: "Bedroom",
              image: "/images/products/bed-1.jpg",
              slug: "bedroom",
            },
            {
              name: "Dining Room",
              image: "/images/products/dining-1.jpg",
              slug: "dining",
            },
            {
              name: "Home Office",
              image: "/images/products/chair-1.jpg",
              slug: "office",
            },
          ].map((room) => (
            <Link
              key={room.name}
              href={`/categories/${room.slug}`}
              className="relative h-48 rounded-lg overflow-hidden group"
            >
              <Image
                src={room.image}
                alt={room.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold text-lg">{room.name}</h3>
                <span className="text-white/80 text-sm flex items-center gap-1 group-hover:text-accent transition-colors">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
