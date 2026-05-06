"use client";

import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddToCartButtonProps {
  productId: Id<"products">;
  stock: number;
  className?: string;
}

export function AddToCartButton({
  productId,
  stock,
  className,
}: AddToCartButtonProps) {
  const { isSignedIn } = useUser();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to add items to your cart");
      return;
    }
    setLoading(true);
    await addToCart(productId);
    setLoading(false);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={stock === 0 || loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="mr-2 h-4 w-4" />
      )}
      {stock === 0 ? "Out of Stock" : "Add to Cart"}
    </Button>
  );
}
