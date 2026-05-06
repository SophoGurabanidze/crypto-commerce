"use client";

import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemProps {
  itemId: Id<"cartItems">;
  product: {
    _id: Id<"products">;
    name: string;
    price: number;
    stock: number;
    productType: string;
    imageUrl: string | null;
  };
  quantity: number;
}

export function CartItem({ itemId, product, quantity }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex gap-4 py-4">
      {/* Image */}
      <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            No img
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{product.name}</h4>
        <p className="text-sm text-muted-foreground">
          ${(product.price / 100).toFixed(2)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => updateQuantity(itemId, quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={quantity >= product.stock}
            onClick={() => updateQuantity(itemId, quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Total + Remove */}
      <div className="flex flex-col items-end justify-between">
        <span className="font-medium">
          ${((product.price * quantity) / 100).toFixed(2)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => removeFromCart(itemId)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
