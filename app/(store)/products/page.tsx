"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/product-grid";
import { ProductFilters } from "@/components/products/product-filters";
import { useAppSelector } from "@/lib/store/hooks";

export default function ProductsPage() {
  const selectedCategory = useAppSelector((state) => state.ui.productCategoryId);
  const selectedType = useAppSelector((state) => state.ui.productType);

  const products = useQuery(api.products.list, {
    categoryId: selectedCategory ?? undefined,
    productType: selectedType ?? undefined,
    onlyActive: true,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>

      <div className="flex gap-8">
        <aside className="hidden md:block w-64 flex-shrink-0">
          <ProductFilters />
        </aside>

        <div className="flex-1">
          {products === undefined ? (
            <ProductGridSkeleton />
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </div>
  );
}
