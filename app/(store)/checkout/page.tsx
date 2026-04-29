"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-context";
import { useAuth, getSessionId } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { createOrder, initiateMpesaPayment, createStripeSession } from "@/lib/api";

type PaymentMethod = "mpesa" | "stripe";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, refresh } = useCart();
  const { user, token } = useAuth();
  
  const [step, setStep] = useState<"info" | "payment" | "processing">("info");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");

  const [formData, setFormData] = useState({
    email: user?.email || "",
    phone: user?.phone || "",
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    address: "",
    city: "",
    county: "",
    postalCode: "",
  });

  const shippingCost = total >= 50000 ? 0 : 500;
  const orderTotal = total + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const sessionId = getSessionId();
      const response = await createOrder({
        email: formData.email,
        phone: formData.phone,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          county: formData.county,
          postalCode: formData.postalCode,
          country: "Kenya",
        },
        paymentMethod,
      }, sessionId, token || undefined);

      setOrderId(response.order.id);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!orderId || !mpesaPhone) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      await initiateMpesaPayment(orderId, mpesaPhone);
      setStep("processing");
      
      // Poll for payment status
      const checkPayment = async () => {
        try {
          const response = await fetch(`/api/payments/mpesa/status/${orderId}`);
          const data = await response.json();
          
          if (data.status === "completed") {
            refresh();
            router.push(`/checkout/success?order=${orderId}`);
          } else if (data.status === "failed") {
            setError("Payment failed. Please try again.");
            setStep("payment");
          } else {
            // Keep polling
            setTimeout(checkPayment, 3000);
          }
        } catch {
          setTimeout(checkPayment, 3000);
        }
      };
      
      setTimeout(checkPayment, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
      setIsSubmitting(false);
    }
  };

  const handleStripePayment = async () => {
    if (!orderId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await createStripeSession(orderId);
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create payment session");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && step === "info") {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="text-center py-16">
          <h2 className="text-xl font-medium text-foreground mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-6">
            Add some items to your cart to checkout
          </p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Back Link */}
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <div className="lg:grid lg:grid-cols-2 lg:gap-12">
        {/* Left - Form */}
        <div>
          <h1 className="font-serif text-3xl font-medium text-foreground mb-8">
            Checkout
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {step === "info" && (
            <form onSubmit={handleSubmitInfo} className="space-y-6">
              {/* Contact */}
              <div>
                <h2 className="font-semibold text-foreground mb-4">Contact Information</h2>
                <div className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+254..."
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div>
                <h2 className="font-semibold text-foreground mb-4">Shipping Address</h2>
                <div className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="county">County</Label>
                      <Input
                        id="county"
                        name="county"
                        required
                        value={formData.county}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h2 className="font-semibold text-foreground mb-4">Payment Method</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mpesa")}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      paymentMethod === "mpesa"
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium">M-Pesa</p>
                        <p className="text-sm text-muted-foreground">Pay with M-Pesa</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("stripe")}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      paymentMethod === "stripe"
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-medium">Card</p>
                        <p className="text-sm text-muted-foreground">Visa, Mastercard, etc.</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </form>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              <h2 className="font-semibold text-foreground">Complete Payment</h2>

              {paymentMethod === "mpesa" ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Enter your M-Pesa phone number to receive the payment prompt.
                  </p>
                  <div>
                    <Label htmlFor="mpesaPhone">M-Pesa Phone Number</Label>
                    <Input
                      id="mpesaPhone"
                      type="tel"
                      placeholder="0712345678"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                    />
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleMpesaPayment}
                    disabled={isSubmitting || !mpesaPhone}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending STK Push...
                      </>
                    ) : (
                      `Pay ${formatPrice(orderTotal)} with M-Pesa`
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    You will be redirected to Stripe to complete your payment securely.
                  </p>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleStripePayment}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Redirecting...
                      </>
                    ) : (
                      `Pay ${formatPrice(orderTotal)} with Card`
                    )}
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep("info")}
                disabled={isSubmitting}
              >
                Go Back
              </Button>
            </div>
          )}

          {step === "processing" && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
              <h2 className="text-xl font-medium text-foreground mb-2">
                Waiting for Payment
              </h2>
              <p className="text-muted-foreground">
                Please check your phone and enter your M-Pesa PIN to complete the payment.
              </p>
            </div>
          )}

          {!user && step === "info" && (
            <p className="mt-6 text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/auth/login?redirect=/checkout" className="text-accent hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>

        {/* Right - Order Summary */}
        <div className="mt-8 lg:mt-0">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Order Summary
            </h2>

            {/* Items */}
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {items.map((item) => {
                const imageUrl = item.images?.[0] || "/images/hero-living-room.jpg";
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                      <Image
                        src={imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border mt-6 pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {shippingCost === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-semibold text-primary text-lg">
                    {formatPrice(orderTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
