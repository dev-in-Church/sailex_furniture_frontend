"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/api";
import { useCart } from "@/lib/cart-context";

/**
 * Round "+" button on the product image. Once the product is in the cart it
 * turns into a [trash/minus] [qty] [plus] stepper. Cart state, errors and the
 * header badge all come from useCart().
 */
export function CartControl({ product }: { product: Product }) {
  const { items, addToCart, updateQuantity, removeItem } = useCart();
  const [busy, setBusy] = useState(false);

  const line = items.find((item) => item.product_id === product.id);

  const stock = Number(product.stock_quantity);
  const maxQuantity = Number.isFinite(stock) ? stock : 99;

  // useCart() reports its own errors; `action` resolves to true on success
  const run = async (
    action: () => Promise<boolean>,
    successMessage?: string,
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await action();
      if (ok && successMessage) toast.success(successMessage);
    } finally {
      setBusy(false);
    }
  };

  if (!line) {
    return (
      <button
        type="button"
        onClick={() =>
          run(
            () =>
              addToCart(product.id, 1, {
                name: product.name,
                slug: product.slug,
                price: product.price,
                images: product.images,
                stock_quantity: product.stock_quantity,
              }),
            `${product.name} added to cart`,
          )
        }
        disabled={busy}
        aria-label={`Add ${product.name} to cart`}
        className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/90 text-white shadow-md transition hover:bg-neutral-900 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </button>
    );
  }

  const canDecrease = line.quantity > 1;

  return (
    <div
      role="group"
      aria-label={`${product.name} quantity`}
      className="absolute right-2 top-2 z-10 flex items-center rounded-full bg-white p-0.5 shadow-md ring-1 ring-border"
    >
      <button
        type="button"
        onClick={() =>
          run(() =>
            canDecrease
              ? updateQuantity(line.id, line.quantity - 1)
              : removeItem(line.id),
          )
        }
        disabled={busy}
        aria-label={canDecrease ? "Decrease quantity" : "Remove from cart"}
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-muted disabled:opacity-60"
      >
        {canDecrease ? (
          <Minus className="h-4 w-4" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>

      <span
        aria-live="polite"
        className="min-w-6 px-1 text-center text-sm font-semibold text-foreground"
      >
        {line.quantity}
      </span>

      <button
        type="button"
        onClick={() => run(() => updateQuantity(line.id, line.quantity + 1))}
        disabled={busy || line.quantity >= maxQuantity}
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-neutral-800 disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
