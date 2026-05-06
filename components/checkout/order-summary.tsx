"use client";

import { Separator } from "@/components/ui/separator";

interface OrderSummaryItem {
  productName: string;
  price: number;
  quantity: number;
}

interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

export function OrderSummary({
  items,
  subtotal,
  shippingCost,
  tax,
  total,
}: OrderSummaryProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Order Summary</h3>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>
              {item.productName} x{item.quantity}
            </span>
            <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${(subtotal / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {shippingCost === 0 ? "Free" : `$${(shippingCost / 100).toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${(tax / 100).toFixed(2)}</span>
        </div>
      </div>

      <Separator />

      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>${(total / 100).toFixed(2)}</span>
      </div>
    </div>
  );
}
