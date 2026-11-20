"use client";

import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/api";

// International format, digits only, e.g. 2547XXXXXXXX
const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(
  /\D/g,
  "",
);

const formatKES = (value: number) => `KES ${value.toLocaleString("en-KE")}`;

type WhatsAppOrderButtonProps = {
  product: Product;
  quantity?: number;
  /** "sm" for product cards, "lg" for the product page */
  size?: "sm" | "lg";
};

export function WhatsAppOrderButton({
  product,
  quantity = 1,
  size = "sm",
}: WhatsAppOrderButtonProps) {
  const handleClick = () => {
    if (!WHATSAPP_NUMBER) {
      console.warn("NEXT_PUBLIC_WHATSAPP_NUMBER is not set");
      toast.error("WhatsApp ordering isn't available right now");
      return;
    }

    const unitPrice = Number(product.price);
    const productUrl = `${window.location.origin}/products/${product.slug}`;

    const message = [
      "Hello Sailex Furniture, I'd like to order:",
      product.name,
      quantity > 1 ? `Quantity: ${quantity}` : null,
      quantity > 1
        ? `Price: ${formatKES(unitPrice)} each (total ${formatKES(unitPrice * quantity)})`
        : `Price: ${formatKES(unitPrice)}`,
      productUrl,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const sizeClass =
    size === "lg" ? "gap-2 px-6 py-3 text-sm" : "gap-1.5 px-3 py-2 text-xs";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-center justify-center rounded-full border border-emerald-600 font-semibold text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white ${sizeClass}`}
    >
      <MessageCircle
        className={size === "lg" ? "h-5 w-5" : "h-4 w-4"}
        aria-hidden="true"
      />
      Order via WhatsApp
    </button>
  );
}
