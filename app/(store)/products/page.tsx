"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/product-grid";
import { ProductFilters } from "@/components/products/product-filters";

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | null>(null);
  const [selectedType, setSelectedType] = useState<"physical" | "digital" | null>(null);

  const products = useQuery(api.products.list, {
    categoryId: selectedCategory ?? undefined,
    productType: selectedType ?? undefined,
    onlyActive: true,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <ProductFilters
            selectedCategory={selectedCategory}
            selectedType={selectedType}
            onCategoryChange={setSelectedCategory}
            onTypeChange={setSelectedType}
          />
        </aside>

        {/* Product grid */}
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
