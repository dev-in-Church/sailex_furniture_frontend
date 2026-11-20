"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Loader2,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CartThumb } from "@/components/store/cart-thumb";
import { useCart, type CartItem } from "@/lib/cart-context";
import { useAuth, getSessionId } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import {
  checkMpesaStatus,
  createOrder,
  createStripeSession,
  initiateMpesaPayment,
  type Order,
} from "@/lib/api";
import {
  KENYA_COUNTIES,
  LAST_ORDER_STORAGE_KEY,
  calculateShipping,
  normalizeKenyanPhone,
} from "@/lib/checkout";

type PaymentMethod = "mpesa" | "stripe";
type Step = "info" | "payment" | "processing" | "timeout";

// Card payments stay hidden until Stripe is set up (NEXT_PUBLIC_STRIPE_ENABLED=true)
const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";

const POLL_START_DELAY_MS = 5_000;
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 120_000;

const fieldClass =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STEPS = [
  { id: "info", label: "Details" },
  { id: "pay", label: "Payment" },
] as const;

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <ol
      className="mb-8 flex items-center gap-3 text-sm"
      aria-label="Checkout steps"
    >
      {STEPS.map((step, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li key={step.id} className="flex items-center gap-3">
            <span
              aria-current={active ? "step" : undefined}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                done || active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : number}
            </span>
            <span
              className={
                active ? "font-medium text-foreground" : "text-muted-foreground"
              }
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="h-px w-8 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function OrderSummary({
  items,
  subtotal,
  shipping,
  total,
}: {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}) {
  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-foreground">
        Order Summary
      </h2>

      <ul className="max-h-64 space-y-4 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
              <CartThumb src={item.images?.[0]} alt={item.name} sizes="64px" />
              <span className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium text-foreground">
                {item.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatPrice(Number(item.price))} × {item.quantity}
              </p>
            </div>
            <p className="text-sm font-medium">{formatPrice(item.subtotal)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-3 border-t border-border pt-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span className="font-medium">
            {shipping === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatPrice(shipping)
            )}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-3">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-lg font-semibold text-primary">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, isLoading, refresh } = useCart();
  const { user, token } = useAuth();

  const [step, setStep] = useState<Step>("info");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");

  // Once the order exists the server empties the cart, so keep what was ordered
  const [order, setOrder] = useState<Order | null>(null);
  const [placedItems, setPlacedItems] = useState<CartItem[] | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    county: "",
    postalCode: "",
    notes: "",
  });

  // The account loads after first render, so fill blank fields once it arrives
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      email: prev.email || user.email || "",
      phone: prev.phone || user.phone || "",
      firstName: prev.firstName || user.name?.split(" ")[0] || "",
      lastName: prev.lastName || user.name?.split(" ").slice(1).join(" ") || "",
    }));
  }, [user]);

  const orderId = order?.id ?? null;
  const orderEmail = order?.email ?? null;

  // Poll for the M-Pesa result while the customer enters their PIN
  useEffect(() => {
    if (step !== "processing" || !orderId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const { status, message } = await checkMpesaStatus(
          orderId,
          orderEmail ?? undefined,
          token || undefined,
        );
        if (cancelled) return;

        if (status === "completed" || status === "paid") {
          router.push(`/checkout/success?order=${orderId}`);
          return;
        }
        if (status === "failed") {
          setError(
            message || "The payment failed or was cancelled. Please try again.",
          );
          setStep("payment");
          return;
        }
      } catch {
        // Network hiccup: keep trying until the timeout
      }

      if (cancelled) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setStep("timeout");
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    timer = setTimeout(poll, POLL_START_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [step, orderId, orderEmail, token, router]);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitInfo = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);

    const phone = normalizeKenyanPhone(formData.phone);
    if (!phone) {
      setError("Enter a valid Kenyan phone number, like 0712 345 678.");
      return;
    }
    if (items.some((item) => item.quantity > item.stock_quantity)) {
      setError(
        "Some items are no longer available in the quantity you chose. Please review your cart.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createOrder(
        {
          email: formData.email.trim(),
          phone,
          shippingAddress: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            county: formData.county,
            postalCode: formData.postalCode.trim() || undefined,
            country: "Kenya",
          },
          notes: formData.notes.trim() || undefined,
          paymentMethod,
        },
        getSessionId(),
        token || undefined,
      );

      setOrder(response.order);
      setPlacedItems(items);
      setMpesaPhone((prev) => prev || phone);

      // The success page uses this to load the order (guests prove ownership by email)
      try {
        sessionStorage.setItem(
          LAST_ORDER_STORAGE_KEY,
          JSON.stringify({
            id: response.order.id,
            orderNumber: response.order.order_number,
            email: response.order.email,
          }),
        );
      } catch {
        /* storage unavailable */
      }

      refresh(); // the server emptied the cart; update the header badge
      setStep("payment");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to place your order",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!order || isSubmitting) return;

    const phone = normalizeKenyanPhone(mpesaPhone);
    if (!phone) {
      setError("Enter a valid Safaricom number, like 0712 345 678.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await initiateMpesaPayment(
        order.id,
        phone,
        order.email,
        token || undefined,
      );
      setStep("processing");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send the payment prompt",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripePayment = async () => {
    if (!order || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await createStripeSession(
        order.id,
        order.email,
        token || undefined,
      );
      if (response.url) {
        window.location.href = response.url;
        return;
      }
      setError("Couldn't start card payment. Please try again.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create payment session",
      );
    }
    setIsSubmitting(false);
  };

  /* ------------------------------ render states ----------------------------- */

  const shell = "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12";

  if (isLoading && step === "info" && !order) {
    return (
      <div className={shell}>
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <Skeleton className="mt-8 h-80 lg:mt-0" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && step === "info" && !order) {
    return (
      <div className={shell}>
        <div className="py-16 text-center">
          <h2 className="mb-2 text-xl font-medium text-foreground">
            Your cart is empty
          </h2>
          <p className="mb-6 text-muted-foreground">
            Add some items to your cart to check out.
          </p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Once the order exists, show what was actually ordered with the server's totals
  const summaryItems = placedItems ?? items;
  const subtotal = order ? Number(order.subtotal) : total;
  const shipping = order
    ? Number(order.shipping_cost)
    : calculateShipping(total);
  const orderTotal = order ? Number(order.total) : total + shipping;

  const summary = (
    <OrderSummary
      items={summaryItems}
      subtotal={subtotal}
      shipping={shipping}
      total={orderTotal}
    />
  );

  const paymentMethods = [
    {
      id: "mpesa" as const,
      name: "M-Pesa",
      hint: "Pay with your phone",
      icon: <Smartphone className="h-6 w-6 text-green-600" />,
    },
    ...(STRIPE_ENABLED
      ? [
          {
            id: "stripe" as const,
            name: "Card",
            hint: "Visa, Mastercard, etc.",
            icon: <CreditCard className="h-6 w-6 text-blue-600" />,
          },
        ]
      : []),
  ];

  return (
    <div className={shell}>
      {step === "info" && (
        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Cart
        </Link>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-12">
        {/* Left: form / payment */}
        <div>
          <h1 className="mb-6 font-serif text-3xl font-medium text-foreground">
            Checkout
          </h1>
          <StepIndicator current={step === "info" ? 1 : 2} />

          {/* Order summary: collapsible on mobile */}
          <details className="mb-6 rounded-lg border border-border bg-card lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                Order summary
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="text-primary">{formatPrice(orderTotal)}</span>
            </summary>
            <div className="border-t border-border p-4">{summary}</div>
          </details>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {step === "info" && (
            <form onSubmit={handleSubmitInfo} className="space-y-8">
              <section>
                <h2 className="mb-4 font-semibold text-foreground">
                  Contact Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email" htmlFor="email">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </Field>
                  <Field label="Phone" htmlFor="phone">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="0712 345 678"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </Field>
                </div>
              </section>

              <section>
                <h2 className="mb-4 font-semibold text-foreground">
                  Delivery Address
                </h2>
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First Name" htmlFor="firstName">
                      <Input
                        id="firstName"
                        name="firstName"
                        autoComplete="given-name"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </Field>
                    <Field label="Last Name" htmlFor="lastName">
                      <Input
                        id="lastName"
                        name="lastName"
                        autoComplete="family-name"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </Field>
                  </div>
                  <Field label="Address" htmlFor="address">
                    <Input
                      id="address"
                      name="address"
                      autoComplete="street-address"
                      placeholder="Street, building, estate"
                      required
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Town / City" htmlFor="city">
                      <Input
                        id="city"
                        name="city"
                        autoComplete="address-level2"
                        required
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </Field>
                    <Field label="County" htmlFor="county">
                      <select
                        id="county"
                        name="county"
                        autoComplete="address-level1"
                        required
                        value={formData.county}
                        onChange={handleChange}
                        className={fieldClass}
                      >
                        <option value="">Select county</option>
                        {KENYA_COUNTIES.map((county) => (
                          <option key={county} value={county}>
                            {county}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Postal Code (optional)" htmlFor="postalCode">
                      <Input
                        id="postalCode"
                        name="postalCode"
                        autoComplete="postal-code"
                        value={formData.postalCode}
                        onChange={handleChange}
                      />
                    </Field>
                  </div>
                  <Field label="Delivery notes (optional)" htmlFor="notes">
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      maxLength={500}
                      placeholder="Landmarks, gate instructions, preferred delivery time..."
                      value={formData.notes}
                      onChange={handleChange}
                      className={fieldClass}
                    />
                  </Field>
                </div>
              </section>

              <section>
                <h2 className="mb-4 font-semibold text-foreground">
                  Payment Method
                </h2>
                <div
                  className={`grid gap-4 ${paymentMethods.length > 1 ? "sm:grid-cols-2" : ""}`}
                  role="radiogroup"
                  aria-label="Payment method"
                >
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        paymentMethod === method.id
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {method.icon}
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {method.hint}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing order...
                    </>
                  ) : (
                    "Place order"
                  )}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  You&apos;ll pay in the next step.
                </p>
              </div>

              {!user && (
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login?redirect=/checkout"
                    className="text-accent hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </form>
          )}

          {step === "payment" && order && (
            <div className="space-y-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                <p className="font-medium">Order {order.order_number} placed</p>
                <p className="mt-1">
                  We&apos;re holding your items. Complete the payment of{" "}
                  <span className="font-semibold">
                    {formatPrice(orderTotal)}
                  </span>{" "}
                  to confirm it.
                </p>
              </div>

              {paymentMethod === "mpesa" ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Enter the M-Pesa number to receive the payment prompt.
                  </p>
                  <Field label="M-Pesa Phone Number" htmlFor="mpesaPhone">
                    <Input
                      id="mpesaPhone"
                      type="tel"
                      inputMode="tel"
                      placeholder="0712 345 678"
                      value={mpesaPhone}
                      onChange={(event) => setMpesaPhone(event.target.value)}
                    />
                  </Field>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleMpesaPayment}
                    disabled={isSubmitting || !mpesaPhone}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending prompt...
                      </>
                    ) : (
                      `Pay ${formatPrice(orderTotal)} with M-Pesa`
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    You&apos;ll be redirected to Stripe to pay securely.
                  </p>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleStripePayment}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      `Pay ${formatPrice(orderTotal)} with Card`
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "processing" && (
            <div className="py-12 text-center" role="status" aria-live="polite">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-accent" />
              <h2 className="mb-2 text-xl font-medium text-foreground">
                Waiting for payment
              </h2>
              <p className="text-muted-foreground">
                Check your phone and enter your M-Pesa PIN to complete the
                payment. This page updates automatically.
              </p>
            </div>
          )}

          {step === "timeout" && (
            <div className="space-y-4 py-8 text-center" role="status">
              <h2 className="text-xl font-medium text-foreground">
                We haven&apos;t received your payment yet
              </h2>
              <p className="text-muted-foreground">
                If you already paid, it can take a minute to show up. Otherwise
                you can send the prompt again.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button onClick={() => setStep("processing")}>
                  Check again
                </Button>
                <Button variant="outline" onClick={() => setStep("payment")}>
                  Send prompt again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: order summary (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-32 rounded-lg border border-border bg-card p-6">
            {summary}
          </div>
        </aside>
      </div>
    </div>
  );
}
