"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { CartItem } from "./cart-item";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setCartOpen } from "@/lib/store/ui-slice";

export function CartSheet() {
  const { isSignedIn } = useUser();
  const { cartItems, cartCount, cartTotal } = useCart();
  const open = useAppSelector((state) => state.ui.cartOpen);
  const dispatch = useAppDispatch();

  return (
    <Sheet open={open} onOpenChange={(next) => dispatch(setCartOpen(next))}>
      <SheetTrigger className="relative inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground">
        <ShoppingCart className="h-5 w-5" />
        {isSignedIn && cartCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
            {cartCount}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent className="w-80 sm:w-96 flex flex-col">
        <SheetHeader>
          <SheetTitle>Cart ({cartCount})</SheetTitle>
        </SheetHeader>

        {!isSignedIn ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Sign in to view your cart</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y">
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

            <Separator />

            <div className="space-y-4 pt-4">
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>${(cartTotal / 100).toFixed(2)}</span>
              </div>
              <Link href="/checkout" onClick={() => dispatch(setCartOpen(false))}>
                <Button className="w-full">Proceed to Checkout</Button>
              </Link>
              <Link href="/cart" onClick={() => dispatch(setCartOpen(false))}>
                <Button variant="outline" className="w-full mt-2">
                  View Full Cart
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
