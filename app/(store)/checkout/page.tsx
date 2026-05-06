"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ShippingForm,
  type ShippingAddress,
} from "@/components/checkout/shipping-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import {
  PaymentMethodSelector,
  type PaymentMethod,
} from "@/components/checkout/payment-method-selector";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cartItems, cartTotal, isLoading } = useCart();
  const createOrder = useMutation(api.orders.create);
  const createStripeSession = useAction(api.stripe.createCheckoutSession);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  });

  // Check if cancelled from Stripe
  if (searchParams.get("cancelled") === "true") {
    toast.error("Payment was cancelled");
  }

  const hasPhysical = cartItems.some(
    (item) => item?.product.productType === "physical"
  );

  const shippingCost = hasPhysical ? 5 : 0; // $0.05 flat rate for physical (test mode)
  const tax = Math.round(cartTotal * 0.08); // 8% tax
  const total = cartTotal + shippingCost + tax;

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (hasPhysical && !address.street) {
      toast.error("Please fill in the shipping address");
      return;
    }

    setProcessing(true);
    try {
      const items = cartItems
        .filter(Boolean)
        .map((item) => ({
          productId: item!.product._id,
          productName: item!.product.name,
          productImage: undefined,
          price: item!.product.price,
          quantity: item!.quantity,
          productType: item!.product.productType as "physical" | "digital",
          hasAuthCertificate: item!.product.hasAuthCertificate ?? false,
        }));

      const stripePaymentMethod =
        paymentMethod === "stripe" ? "stripe" as const : "crypto_eth" as const;

      const orderId = await createOrder({
        items,
        subtotal: cartTotal,
        shippingCost,
        tax,
        total,
        paymentMethod: stripePaymentMethod,
        shippingAddress: hasPhysical ? address : undefined,
      });

      if (paymentMethod === "stripe") {
        const sessionUrl = await createStripeSession({ orderId });
        if (sessionUrl) {
          window.location.href = sessionUrl;
          return;
        }
        toast.error("Failed to create Stripe session");
      } else {
        // Redirect to crypto checkout page
        router.push(`/checkout/crypto?orderId=${orderId}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Checkout failed"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <p className="text-muted-foreground">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {hasPhysical && (
            <Card>
              <CardContent className="p-6">
                <ShippingForm address={address} onChange={setAddress} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <PaymentMethodSelector
                selected={paymentMethod}
                onChange={setPaymentMethod}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <OrderSummary
                items={cartItems
                  .filter(Boolean)
                  .map((item) => ({
                    productName: item!.product.name,
                    price: item!.product.price,
                    quantity: item!.quantity,
                  }))}
                subtotal={cartTotal}
                shippingCost={shippingCost}
                tax={tax}
                total={total}
              />

              <Separator />

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={processing}
              >
                {processing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {paymentMethod === "stripe"
                  ? "Pay with Stripe"
                  : "Continue to Crypto Payment"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
