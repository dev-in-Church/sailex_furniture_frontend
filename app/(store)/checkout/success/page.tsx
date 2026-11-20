"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  MessageCircle,
  Package,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOrder, type Order } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate, formatPrice } from "@/lib/format";
import { LAST_ORDER_STORAGE_KEY } from "@/lib/checkout";

const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(
  /\D/g,
  "",
);

const POLL_INTERVAL_MS = 4_000;
const POLL_TIMEOUT_MS = 120_000;

type LastOrder = { id: string; orderNumber: string; email: string };
type LoadState = "loading" | "ready" | "needs-email" | "not-found" | "error";

function readLastOrder(): LastOrder | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch {
    return null;
  }
}

function SupportLink({ orderNumber }: { orderNumber?: string }) {
  if (!WHATSAPP_NUMBER) return null;
  const text = orderNumber
    ? `Hello Sailex Furniture, I need help with order ${orderNumber}.`
    : "Hello Sailex Furniture, I need help with my order.";
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
    >
      <MessageCircle className="h-4 w-4" />
      Chat with us on WhatsApp
    </a>
  );
}

function StatusHeader({ order, polling }: { order: Order; polling: boolean }) {
  if (order.payment_status === "paid") {
    return (
      <div className="mb-12 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mb-4 font-serif text-3xl font-medium text-foreground md:text-4xl">
          Thank you for your order!
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          Your payment was received and your order is confirmed.
        </p>
      </div>
    );
  }

  if (order.payment_status === "pending") {
    return (
      <div className="mb-12 text-center" role="status" aria-live="polite">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          {polling ? (
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          ) : (
            <Clock className="h-8 w-8 text-amber-600" />
          )}
        </div>
        <h1 className="mb-4 font-serif text-3xl font-medium text-foreground md:text-4xl">
          {polling
            ? "Confirming your payment"
            : "We haven't received your payment yet"}
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          {polling
            ? "This page updates automatically. It usually takes a few seconds."
            : "If you've already paid, it can take a few minutes to show up. Otherwise, contact us and we'll help you finish the order."}
        </p>
        {!polling && (
          <div className="mt-4">
            <SupportLink orderNumber={order.order_number} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-12 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="mb-4 font-serif text-3xl font-medium text-foreground md:text-4xl">
        Payment not completed
      </h1>
      <p className="mx-auto max-w-md text-muted-foreground">
        Your order {order.order_number} hasn&apos;t been paid. Contact us and
        we&apos;ll help you complete it.
      </p>
      <div className="mt-4">
        <SupportLink orderNumber={order.order_number} />
      </div>
    </div>
  );
}

const paymentBadge: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-green-100 text-green-700" },
  pending: {
    label: "Awaiting payment",
    className: "bg-amber-100 text-amber-700",
  },
  failed: { label: "Payment failed", className: "bg-red-100 text-red-700" },
  refunded: {
    label: "Refunded",
    className: "bg-secondary text-muted-foreground",
  },
};

function OrderDetails({ order }: { order: Order }) {
  const badge = paymentBadge[order.payment_status] ?? paymentBadge.pending;
  const address = order.shipping_address;

  return (
    <>
      <div className="mb-8 rounded-lg border border-border bg-card p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-semibold text-foreground">
              {order.order_number}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-muted-foreground">Order Date</p>
            <p className="font-medium text-foreground">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-6 border-b border-border pb-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Delivery Address
            </p>
            <div className="text-foreground">
              <p className="font-medium">
                {address?.firstName} {address?.lastName}
              </p>
              <p>{address?.address}</p>
              <p>
                {address?.city}
                {address?.county ? `, ${address.county}` : ""}
              </p>
              <p>{address?.country}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Payment</p>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {order.payment_method === "mpesa" ? "M-Pesa" : "Card"}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="mb-6 border-b border-border pb-6">
            <p className="mb-4 text-sm text-muted-foreground">Items Ordered</p>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      × {item.quantity}
                    </span>
                  </div>
                  <span>{formatPrice(Number(item.price) * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span>
              {Number(order.shipping_cost) === 0
                ? "Free"
                : formatPrice(Number(order.shipping_cost))}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">
              {formatPrice(Number(order.total))}
            </span>
          </div>
        </div>
      </div>

      {order.payment_status === "paid" && (
        <div className="mb-8 rounded-lg border border-border bg-secondary/50 p-6">
          <div className="flex items-start gap-4">
            <Package className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
            <div>
              <h2 className="mb-1 font-semibold text-foreground">
                What happens next?
              </h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ll prepare your order and get in touch
                {order.phone ? ` on ${order.phone}` : ` at ${order.email}`} to
                arrange delivery.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const identifier = searchParams.get("order");
  const { token, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const pollStartedAt = useRef<number | null>(null);

  // Guests prove ownership with the checkout email (saved by the checkout page)
  const savedEmail = useCallback(() => {
    const last = readLastOrder();
    return last && (last.id === identifier || last.orderNumber === identifier)
      ? last.email
      : undefined;
  }, [identifier]);

  const load = useCallback(
    async (email?: string): Promise<LoadState> => {
      if (!identifier) {
        setState("not-found");
        return "not-found";
      }
      const proofEmail = email ?? savedEmail();
      const canProve = Boolean(token) || Boolean(proofEmail);

      try {
        const { order: loaded } = await getOrder(
          identifier,
          token || undefined,
          proofEmail,
        );
        setOrder(loaded);
        setState("ready");
        return "ready";
      } catch (err) {
        const notFound =
          err instanceof Error && err.message === "Order not found";
        // Without proof the server can't tell us apart from a stranger: ask for the email
        const next: LoadState = notFound
          ? canProve
            ? "not-found"
            : "needs-email"
          : "error";
        setState((prev) => (prev === "ready" ? prev : next));
        return next;
      }
    },
    [identifier, token, savedEmail],
  );

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  // While the payment is still pending, keep checking for a couple of minutes
  const paymentPending = order?.payment_status === "pending";
  useEffect(() => {
    if (!paymentPending) return;
    if (pollStartedAt.current === null) pollStartedAt.current = Date.now();

    const timer = setInterval(() => {
      if (Date.now() - (pollStartedAt.current ?? 0) > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        setTimedOut(true);
        return;
      }
      void load();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [paymentPending, load]);

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setEmailError(null);
    setIsChecking(true);
    const result = await load(emailInput.trim());
    if (result !== "ready") {
      setEmailError(
        "That email doesn't match this order. Please check and try again.",
      );
    }
    setIsChecking(false);
  };

  const shell = "mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20";

  if (state === "loading") {
    return (
      <div className={`${shell} flex justify-center`}>
        <Loader2
          className="h-8 w-8 animate-spin text-accent"
          aria-label="Loading your order"
        />
      </div>
    );
  }

  if (state === "needs-email") {
    return (
      <div className={shell}>
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-2 font-serif text-2xl font-medium text-foreground">
            View your order
          </h1>
          <p className="mb-6 text-muted-foreground">
            Enter the email you used at checkout to see this order.
          </p>
          <form onSubmit={handleEmailSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="order-email">Email</Label>
              <Input
                id="order-email"
                type="email"
                autoComplete="email"
                required
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
              />
            </div>
            {emailError && (
              <p role="alert" className="text-sm text-destructive">
                {emailError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isChecking}>
              {isChecking ? "Checking..." : "View order"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (state === "not-found" || state === "error" || !order) {
    return (
      <div className={`${shell} text-center`}>
        <h1 className="mb-2 font-serif text-2xl font-medium text-foreground">
          {state === "error"
            ? "We couldn't load your order"
            : "We couldn't find this order"}
        </h1>
        <p className="mb-6 text-muted-foreground">
          {state === "error"
            ? "Something went wrong on our side. Please try again in a moment."
            : "If you've just paid, your order is safe. Contact us and we'll find it for you."}
        </p>
        <div className="flex flex-col items-center gap-4">
          <SupportLink />
          <Link href="/products">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <StatusHeader order={order} polling={paymentPending && !timedOut} />
      <OrderDetails order={order} />

      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        {token && (
          <Link href="/account/orders">
            <Button variant="outline" className="w-full sm:w-auto">
              View Order History
            </Button>
          </Link>
        )}
        <Link href="/products">
          <Button className="w-full gap-2 sm:w-auto">
            Continue Shopping
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center px-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
