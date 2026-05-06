"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/product-grid";
import { Doc } from "@/convex/_generated/dataModel";

export default function WishlistPage() {
  const products = useQuery(api.wishlists.getByUser);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Wishlist</h1>

      {products === undefined ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <ProductGrid products={products as Doc<"products">[]} />
      )}
    </div>
  );
}
