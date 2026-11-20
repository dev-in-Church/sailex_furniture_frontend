"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CartThumb } from "@/components/store/cart-thumb";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, calculateShipping } from "@/lib/checkout";

// International format, digits only, e.g. 2547XXXXXXXX
const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(
  /\D/g,
  "",
);

export default function CartPage() {
  const { items, total, isLoading, updateQuantity, removeItem } = useCart();
  const [busyItems, setBusyItems] = useState<Set<string>>(new Set());

  const withBusy = async (itemId: string, action: () => Promise<unknown>) => {
    setBusyItems((prev) => new Set(prev).add(itemId));
    try {
      await action();
    } finally {
      setBusyItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemove = (itemId: string, name: string) =>
    withBusy(itemId, async () => {
      const ok = await removeItem(itemId);
      if (ok) toast(`${name} removed from your cart`);
    });

  const shippingCost = calculateShipping(total);
  const orderTotal = total + shippingCost;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const freeShippingProgress = Math.min(
    100,
    (total / FREE_SHIPPING_THRESHOLD) * 100,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Items that can't be bought in the chosen quantity (stock changed since adding)
  const problemItems = items.filter(
    (item) => item.quantity > item.stock_quantity,
  );
  const hasStockIssue = problemItems.length > 0;

  const orderViaWhatsApp = () => {
    if (!WHATSAPP_NUMBER) {
      console.warn("NEXT_PUBLIC_WHATSAPP_NUMBER is not set");
      toast.error("WhatsApp ordering isn't available right now");
      return;
    }
    const lines = items.map(
      (item, index) =>
        `${index + 1}. ${item.name} × ${item.quantity} (${formatPrice(item.subtotal)})`,
    );
    const message = [
      "Hello Sailex Furniture, I'd like to order:",
      ...lines,
      `Total: ${formatPrice(orderTotal)}${shippingCost === 0 ? " (free delivery)" : ` (includes ${formatPrice(shippingCost)} delivery)`}`,
    ].join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const pageTitle = (
    <h1 className="mb-8 font-serif text-3xl font-medium text-foreground md:text-4xl">
      Shopping Cart
      {itemCount > 0 && (
        <span className="ml-3 text-lg font-normal text-muted-foreground">
          ({itemCount} {itemCount === 1 ? "item" : "items"})
        </span>
      )}
    </h1>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {pageTitle}
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          <div className="space-y-4 lg:col-span-7">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-lg border border-border p-4"
              >
                <Skeleton className="h-24 w-24 rounded-lg sm:h-32 sm:w-32" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="mt-8 h-72 rounded-lg lg:col-span-5 lg:mt-0" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {pageTitle}
        <div className="py-16 text-center">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-medium text-foreground">
            Your cart is empty
          </h2>
          <p className="mb-6 text-muted-foreground">
            Looks like you haven&apos;t added any items to your cart yet.
          </p>
          <Link href="/products">
            <Button className="gap-2">
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {pageTitle}

      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Cart items */}
        <div className="lg:col-span-7">
          {hasStockIssue && (
            <div
              role="alert"
              className="mb-4 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Some items are no longer available in the quantity you chose.
                Please update them to continue to checkout.
              </p>
            </div>
          )}

          <ul className="divide-y divide-border rounded-lg border border-border">
            {items.map((item) => {
              const isBusy = busyItems.has(item.id);
              const outOfStock = item.stock_quantity <= 0;
              const overStock = item.quantity > item.stock_quantity;

              return (
                <li
                  key={item.id}
                  className={`flex gap-4 p-4 sm:gap-6 sm:p-6 ${isBusy ? "opacity-50" : ""}`}
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary sm:h-32 sm:w-32"
                  >
                    <CartThumb
                      src={item.images?.[0]}
                      alt={item.name}
                      sizes="128px"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          className="line-clamp-2 font-medium text-foreground transition-colors hover:text-accent"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatPrice(Number(item.price))} each
                        </p>
                        {outOfStock ? (
                          <p className="mt-1 text-sm font-medium text-destructive">
                            Out of stock. Remove it to continue.
                          </p>
                        ) : overStock ? (
                          <p className="mt-1 text-sm font-medium text-destructive">
                            Only {item.stock_quantity} available
                          </p>
                        ) : null}
                      </div>
                      <p className="whitespace-nowrap font-semibold text-primary">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            withBusy(item.id, () =>
                              updateQuantity(item.id, item.quantity - 1),
                            )
                          }
                          disabled={isBusy || item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="p-2 transition-colors hover:bg-secondary disabled:opacity-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span
                          aria-live="polite"
                          className="min-w-[40px] px-4 py-2 text-center font-medium"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            withBusy(item.id, () =>
                              updateQuantity(item.id, item.quantity + 1),
                            )
                          }
                          disabled={
                            isBusy || item.quantity >= item.stock_quantity
                          }
                          aria-label={`Increase quantity of ${item.name}`}
                          className="p-2 transition-colors hover:bg-secondary disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id, item.name)}
                        disabled={isBusy}
                        className="p-2 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Remove {item.name}</span>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <Link href="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <div className="mt-8 lg:col-span-5 lg:mt-0">
          <div className="rounded-lg border border-border bg-card p-6 lg:sticky lg:top-32">
            <h2 className="mb-6 text-lg font-semibold text-foreground">
              Order Summary
            </h2>

            {/* Free delivery progress */}
            <div className="mb-6">
              {remainingForFreeShipping > 0 ? (
                <>
                  <p className="mb-2 text-sm text-foreground">
                    Add{" "}
                    <span className="font-semibold">
                      {formatPrice(remainingForFreeShipping)}
                    </span>{" "}
                    more for free delivery
                  </p>
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(freeShippingProgress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progress to free delivery"
                    className="h-2 overflow-hidden rounded-full bg-secondary"
                  >
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <Truck className="h-4 w-4" />
                  You&apos;ve unlocked free delivery
                </p>
              )}
            </div>

            <div className="space-y-4" aria-live="polite">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">
                  {shippingCost === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-lg font-semibold text-primary">
                    {formatPrice(orderTotal)}
                  </span>
                </div>
              </div>
            </div>

            {hasStockIssue ? (
              <Button className="mt-6 w-full" size="lg" disabled>
                Update items to continue
              </Button>
            ) : (
              <Link href="/checkout" className="mt-6 block">
                <Button className="w-full gap-2" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <button
              type="button"
              onClick={orderViaWhatsApp}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-emerald-600 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Order via WhatsApp
            </button>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Secure checkout. Pay with M-Pesa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
