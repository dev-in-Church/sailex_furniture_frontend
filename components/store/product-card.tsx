"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Product } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

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

  const imageUrl = product.images?.[0] || "/placeholder.png";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      await addToCart(product.id);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const [imgSrc, setImgSrc] = useState(
    product.images?.[0] || "/placeholder.png",
  );

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-card rounded-lg overflow-hidden border border-border hover:border-accent transition-colors">
        {/* Image */}
        <div className="relative aspect-square bg-secondary">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => {
              if (imgSrc !== "/placeholder.png") {
                setImgSrc("/placeholder.png");
              }
            }}
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded">
                -{discountPercent}%
              </span>
            )}
            {product.featured && (
              <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
                Featured
              </span>
            )}
          </div>
          {/* Quick Add */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-lg"
              onClick={handleAddToCart}
              disabled={isAdding || product.stock_quantity === 0}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="sr-only">Add to cart</span>
            </Button>
          </div>
          {/* Out of Stock */}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <span className="px-4 py-2 bg-muted text-muted-foreground font-medium rounded">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {product.category_name && (
            <p className="text-xs text-muted-foreground mb-1">
              {product.category_name}
            </p>
          )}
          <h3 className="font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-semibold text-primary">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
