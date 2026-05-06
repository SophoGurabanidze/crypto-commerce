"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ProductForm } from "@/components/admin/product-form";

export default function EditProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const product = useQuery(api.products.getById, {
    id: productId as Id<"products">,
  });

  if (product === undefined) return <p>Loading...</p>;
  if (product === null) return <p>Product not found.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}
