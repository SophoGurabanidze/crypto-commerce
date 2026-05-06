"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Web3Provider } from "@/components/providers/web3-provider";
import { CryptoPaymentPanel } from "@/components/checkout/crypto/crypto-payment-panel";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CryptoCheckoutPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") as Id<"orders"> | null;
  const order = useQuery(
    api.orders.getById,
    orderId ? { id: orderId } : "skip"
  );

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Invalid order</h1>
        <Link href="/products" className="mt-4 inline-block">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  if (order === undefined) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        Loading order...
      </div>
    );
  }

  if (!order || order.status !== "pending") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">
          {order ? "Order already processed" : "Order not found"}
        </h1>
        <Link href="/orders" className="mt-4 inline-block">
          <Button>View Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <Web3Provider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Crypto Payment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Payment options */}
          <div className="lg:col-span-2">
            <CryptoPaymentPanel
              orderId={order._id}
              amountUsd={order.total}
            />
          </div>

          {/* Right: Order summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderSummary
                  items={order.items.map((item) => ({
                    productName: item.productName,
                    price: item.price,
                    quantity: item.quantity,
                  }))}
                  subtotal={order.subtotal}
                  shippingCost={order.shippingCost}
                  tax={order.tax}
                  total={order.total}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Web3Provider>
  );
}
