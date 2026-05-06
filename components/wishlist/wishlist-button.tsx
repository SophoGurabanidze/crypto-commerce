"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WishlistButtonProps {
  productId: Id<"products">;
  size?: "icon" | "default";
}

export function WishlistButton({
  productId,
  size = "icon",
}: WishlistButtonProps) {
  const { isSignedIn } = useUser();
  const isWishlisted = useQuery(
    api.wishlists.isWishlisted,
    isSignedIn ? { productId } : "skip"
  );
  const toggle = useMutation(api.wishlists.toggle);

  const handleClick = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to use wishlists");
      return;
    }
    const added = await toggle({ productId });
    toast.success(added ? "Added to wishlist" : "Removed from wishlist");
  };

  return (
    <Button variant="ghost" size={size} onClick={handleClick}>
      <Heart
        className={cn(
          "h-5 w-5",
          isWishlisted && "fill-red-500 text-red-500"
        )}
      />
      {size === "default" && (
        <span className="ml-2">
          {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        </span>
      )}
    </Button>
  );
}
