"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/components/cart/cart-item";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartPage() {
  const { isSignedIn } = useUser();
  const { cartItems, cartTotal, isLoading } = useCart();

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
        <p className="text-muted-foreground">
          Please sign in to view your cart.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y">
            {cartItems.map(
              (item) =>
                item && (
                  <CartItem
                    key={item._id}
                    itemId={item._id}
                    product={item.product}
                    quantity={item.quantity}
                  />
                )
            )}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="flex justify-between text-lg font-medium">
              <span>Subtotal</span>
              <span>${(cartTotal / 100).toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Shipping and taxes calculated at checkout.
            </p>
            <div className="flex gap-4">
              <Link href="/checkout" className="flex-1">
                <Button className="w-full" size="lg">
                  Checkout
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
