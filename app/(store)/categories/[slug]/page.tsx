"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/product-grid";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = useQuery(api.categories.getBySlug, { slug });
  const products = useQuery(
    api.products.list,
    category ? { categoryId: category._id, onlyActive: true } : "skip"
  );

  if (category === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProductGridSkeleton />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Category Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {products === undefined ? (
        <ProductGridSkeleton />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
