"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Heart,
  Truck,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Product } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-context";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const images = product.images?.length
    ? product.images
    : ["/images/hero-living-room.jpg"];
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

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(product.id, quantity, {
        name: product.name,
        slug: product.slug,
        price: product.price,
        images: product.images,
        stock_quantity: product.stock_quantity,
      });
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const specifications =
    product.specifications && typeof product.specifications === "object"
      ? product.specifications
      : {};

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href="/products"
          className="hover:text-foreground transition-colors"
        >
          Products
        </Link>
        {product.category_name && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/categories/${product.category_slug}`}
              className="hover:text-foreground transition-colors"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground text-sm font-medium rounded">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? "border-accent"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Category */}
          {product.category_name && (
            <Link
              href={`/categories/${product.category_slug}`}
              className="text-sm text-accent hover:underline"
            >
              {product.category_name}
            </Link>
          )}

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mt-2 mb-4">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl font-semibold text-primary">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Stock Status */}
          <div className="mb-6">
            {product.stock_quantity > 10 ? (
              <span className="text-sm text-green-600 font-medium">
                In Stock
              </span>
            ) : product.stock_quantity > 0 ? (
              <span className="text-sm text-yellow-600 font-medium">
                Only {product.stock_quantity} left in stock
              </span>
            ) : (
              <span className="text-sm text-red-600 font-medium">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Quantity Selector */}
            <div className="flex items-center border border-border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-secondary transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-6 py-3 font-medium min-w-[60px] text-center">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity(Math.min(product.stock_quantity, quantity + 1))
                }
                className="p-3 hover:bg-secondary transition-colors"
                disabled={quantity >= product.stock_quantity}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add to Cart */}
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={isAdding || product.stock_quantity === 0}
            >
              <ShoppingBag className="h-5 w-5" />
              {isAdding ? "Adding..." : "Add to Cart"}
            </Button>

            {/* Wishlist */}
            <Button size="lg" variant="outline" className="shrink-0">
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-border mb-8">
            <div className="text-center">
              <Truck className="h-5 w-5 mx-auto text-accent mb-2" />
              <p className="text-xs text-muted-foreground">Free Delivery</p>
            </div>
            <div className="text-center">
              <Shield className="h-5 w-5 mx-auto text-accent mb-2" />
              <p className="text-xs text-muted-foreground">2 Year Warranty</p>
            </div>
            <div className="text-center">
              <RefreshCw className="h-5 w-5 mx-auto text-accent mb-2" />
              <p className="text-xs text-muted-foreground">30 Day Returns</p>
            </div>
          </div>

          {/* Specifications */}
          {Object.keys(specifications).length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4">
                Specifications
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {Object.entries(specifications).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <dt className="text-sm text-muted-foreground capitalize">
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

          {/* SKU */}
          {product.sku && (
            <p className="text-sm text-muted-foreground mt-6">
              SKU: {product.sku}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
