"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export function useCart() {
  const { isLoaded, isSignedIn } = useAuth();
  const skipCart = !isLoaded || !isSignedIn;
  const cartItems = useQuery(
    api.cart.getCartItems,
    skipCart ? "skip" : undefined
  );
  const cartCount = useQuery(
    api.cart.getCartCount,
    skipCart ? "skip" : undefined
  );
  const addItemMutation = useMutation(api.cart.addItem);
  const updateQuantityMutation = useMutation(api.cart.updateQuantity);
  const removeItemMutation = useMutation(api.cart.removeItem);
  const clearCartMutation = useMutation(api.cart.clearCart);

  const addToCart = async (productId: Id<"products">, quantity = 1) => {
    try {
      await addItemMutation({ productId, quantity });
      toast.success("Added to cart");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add to cart"
      );
    }
  };

  const updateQuantity = async (
    itemId: Id<"cartItems">,
    quantity: number
  ) => {
    try {
      await updateQuantityMutation({ itemId, quantity });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update quantity"
      );
    }
  };

  const removeFromCart = async (itemId: Id<"cartItems">) => {
    try {
      await removeItemMutation({ itemId });
      toast.success("Removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    try {
      await clearCartMutation();
    } catch (error) {
      toast.error("Failed to clear cart");
    }
  };

  const cartTotal =
    cartItems?.reduce(
      (sum, item) => sum + (item?.product.price ?? 0) * (item?.quantity ?? 0),
      0
    ) ?? 0;

  return {
    cartItems: cartItems ?? [],
    cartCount: cartCount ?? 0,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoading:
      !isLoaded || (Boolean(isSignedIn) && cartItems === undefined),
  };
}
