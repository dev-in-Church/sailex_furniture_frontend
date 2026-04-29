import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrder, type Order } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/format";

interface SuccessPageProps {
  searchParams: Promise<{ order?: string }>;
}

// Mock order for demo
const mockOrder: Order = {
  id: "123",
  order_number: "SLX-ABC123-XYZ",
  email: "customer@example.com",
  phone: "+254700000000",
  shipping_address: {
    firstName: "John",
    lastName: "Doe",
    address: "123 Main Street",
    city: "Nairobi",
    county: "Nairobi",
    country: "Kenya",
  },
  billing_address: null,
  subtotal: "89999",
  shipping_cost: "0",
  tax: "0",
  total: "89999",
  status: "confirmed",
  payment_method: "mpesa",
  payment_status: "paid",
  notes: null,
  created_at: new Date().toISOString(),
};

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { order: orderIdentifier } = await searchParams;
  
  let order: Order = mockOrder;

  if (orderIdentifier) {
    try {
      const response = await getOrder(orderIdentifier);
      order = response.order;
    } catch (error) {
      console.error("Failed to fetch order:", error);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
          Thank You for Your Order!
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your order has been confirmed and will be shipped soon. 
          We&apos;ve sent a confirmation email to {order.email}.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 md:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-border">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-semibold text-foreground">{order.order_number}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-muted-foreground">Order Date</p>
            <p className="font-medium text-foreground">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-border">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Shipping Address</p>
            <div className="text-foreground">
              <p className="font-medium">
                {order.shipping_address.firstName} {order.shipping_address.lastName}
              </p>
              <p>{order.shipping_address.address}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.county}</p>
              <p>{order.shipping_address.country}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Payment Method</p>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground capitalize">
                {order.payment_method === "mpesa" ? "M-Pesa" : "Card"}
              </span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                Paid
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="mb-6 pb-6 border-b border-border">
            <p className="text-sm text-muted-foreground mb-4">Items Ordered</p>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground"> x {item.quantity}</span>
                  </div>
                  <span>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Total */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {parseFloat(order.shipping_cost) === 0 ? "Free" : formatPrice(order.shipping_cost)}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="bg-secondary/50 border border-border rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <Package className="h-6 w-6 text-accent shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>We&apos;ll prepare your order for shipping</li>
              <li>You&apos;ll receive a tracking number via email</li>
              <li>Your order will be delivered within 3-7 business days</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/account/orders">
          <Button variant="outline" className="w-full sm:w-auto">
            View Order History
          </Button>
        </Link>
        <Link href="/products">
          <Button className="w-full sm:w-auto gap-2">
            Continue Shopping
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
