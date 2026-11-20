"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Share2,
  Shield,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { WhatsAppOrderButton } from "@/components/home/whatsapp-button";

const PLACEHOLDER = "/placeholder.png";
const MAX_PER_ORDER = 99;
const LOW_STOCK_THRESHOLD = 10;

const trustPoints = [
  { icon: Truck, text: "Free delivery over KES 50,000" },
  { icon: Wallet, text: "Pay with M-Pesa" },
  { icon: Shield, text: "Secure checkout" },
];

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { items, addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const rawImages = (product.images ?? []).filter(
    (image): image is string => typeof image === "string" && image.length > 0,
  );
  const images = rawImages.length > 0 ? rawImages : [PLACEHOLDER];
  const imageSrc = (src: string) =>
    failedImages.includes(src) ? PLACEHOLDER : src;
  const currentImage = images[Math.min(selectedImage, images.length - 1)];

  const price = Number(product.price);
  const compareAt = Number(product.compare_at_price);
  const hasDiscount = compareAt > price;
  const discountPercent = hasDiscount
    ? Math.round((1 - price / compareAt) * 100)
    : 0;

  // How many more can be added, counting what's already in the cart
  const stock = Number(product.stock_quantity) || 0;
  const inCart =
    items.find((item) => item.product_id === product.id)?.quantity ?? 0;
  const available = Math.max(0, Math.min(stock - inCart, MAX_PER_ORDER));
  const canAdd = available > 0;

  // Keep the selected quantity within what's available
  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, available)));
  }, [available]);

  const markFailed = (src: string) =>
    setFailedImages((prev) => (prev.includes(src) ? prev : [...prev, src]));

  const goToImage = (delta: number) =>
    setSelectedImage((i) => (i + delta + images.length) % images.length);

  const handleAddToCart = async () => {
    if (!canAdd || isAdding) return;
    setIsAdding(true);
    try {
      const ok = await addToCart(product.id, quantity, {
        name: product.name,
        slug: product.slug,
        price: product.price,
        images: product.images,
        stock_quantity: product.stock_quantity,
      });
      if (ok) {
        toast.success(
          `${quantity > 1 ? `${quantity} × ` : ""}${product.name} added to cart`,
        );
        setQuantity(1);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      /* the person closed the share sheet */
    }
  };

  const specifications =
    product.specifications && typeof product.specifications === "object"
      ? product.specifications
      : {};

  return (
    <div>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href="/products"
          className="transition-colors hover:text-foreground"
        >
          Products
        </Link>
        {product.category_name && product.category_slug && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/categories/${product.category_slug}`}
              className="transition-colors hover:text-foreground"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground" aria-current="page">
          {product.name}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
            <Image
              src={imageSrc(currentImage)}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
              onError={() => markFailed(currentImage)}
            />

            {hasDiscount && (
              <span className="absolute left-4 top-4 rounded bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">
                -{discountPercent}% OFF
              </span>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goToImage(-1)}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md ring-1 ring-border transition-colors hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goToImage(1)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md ring-1 ring-border transition-colors hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={selectedImage === index}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    selectedImage === index
                      ? "border-accent"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={imageSrc(image)}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={() => markFailed(image)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.category_name && product.category_slug && (
            <Link
              href={`/categories/${product.category_slug}`}
              className="text-sm text-accent hover:underline"
            >
              {product.category_name}
            </Link>
          )}

          <h1 className="mb-4 mt-2 font-serif text-3xl font-medium text-foreground md:text-4xl">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mb-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-semibold text-primary">
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(compareAt)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="mt-1 text-sm font-medium text-emerald-700">
                You save {formatPrice(compareAt - price)}
              </p>
            )}
          </div>

          {product.description && (
            <p className="mb-8 whitespace-pre-line leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Stock status */}
          <div className="mb-6">
            {stock <= 0 ? (
              <span className="text-sm font-medium text-red-600">
                Out of stock
              </span>
            ) : stock <= LOW_STOCK_THRESHOLD ? (
              <span className="text-sm font-medium text-amber-600">
                Only {stock} left in stock
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                <Check className="h-4 w-4" aria-hidden="true" />
                In stock
              </span>
            )}
            {inCart > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                You have {inCart} in your cart.{" "}
                <Link href="/cart" className="text-accent hover:underline">
                  View cart
                </Link>
              </p>
            )}
          </div>

          {/* Quantity, add to cart, share */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="flex items-center rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || !canAdd}
                aria-label="Decrease quantity"
                className="p-3 transition-colors hover:bg-secondary disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                aria-live="polite"
                className="min-w-[60px] px-6 py-3 text-center font-medium"
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(available, q + 1))}
                disabled={quantity >= available}
                aria-label="Increase quantity"
                className="p-3 transition-colors hover:bg-secondary disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={isAdding || !canAdd}
            >
              <ShoppingBag className="h-5 w-5" />
              {isAdding
                ? "Adding..."
                : stock <= 0
                  ? "Out of stock"
                  : !canAdd
                    ? "Maximum in cart"
                    : "Add to Cart"}
            </Button>

            <Button
              type="button"
              size="lg"
              variant="outline"
              className="shrink-0"
              onClick={handleShare}
              aria-label="Share this product"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {stock > 0 && (
            <div className="mb-8">
              <WhatsAppOrderButton
                product={product}
                quantity={quantity}
                size="lg"
              />
            </div>
          )}

          {/* Trust points */}
          <ul className="mb-8 grid grid-cols-3 gap-4 border-y border-border py-6">
            {trustPoints.map(({ icon: Icon, text }) => (
              <li key={text} className="text-center">
                <Icon
                  className="mx-auto mb-2 h-5 w-5 text-accent"
                  aria-hidden="true"
                />
                <p className="text-xs text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>

          {/* Specifications */}
          {Object.keys(specifications).length > 0 && (
            <div>
              <h2 className="mb-4 font-semibold text-foreground">
                Specifications
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {Object.entries(specifications).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <dt className="text-sm capitalize text-muted-foreground">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="text-sm font-medium text-foreground">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.sku && (
            <p className="mt-6 text-sm text-muted-foreground">
              SKU: {product.sku}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
