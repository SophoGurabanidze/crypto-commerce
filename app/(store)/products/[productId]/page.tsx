"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ProductImages } from "@/components/products/product-images";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ReviewList } from "@/components/reviews/review-list";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const product = useQuery(api.products.getById, {
    id: productId as Id<"products">,
  });
  const category = useQuery(
    api.categories.getById,
    product?.categoryId ? { id: product.categoryId } : "skip"
  );

  if (product === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <ProductImages imageIds={product.images} />

        {/* Info */}
        <div className="space-y-6">
          <div>
            {category && (
              <p className="text-sm text-muted-foreground mb-1">
                {category.name}
              </p>
            )}
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(product.averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">
              ${(product.price / 100).toFixed(2)}
            </span>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="text-lg text-muted-foreground line-through">
                  ${(product.compareAtPrice / 100).toFixed(2)}
                </span>
              )}
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            <Badge variant="outline">
              {product.productType === "digital" ? "Digital Product" : "Physical Product"}
            </Badge>
            {product.stock > 0 ? (
              <Badge variant="secondary">{product.stock} in stock</Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          <Separator />

          {/* Description */}
          {product.shortDescription && (
            <p className="text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          <div className="flex gap-2">
            <AddToCartButton
              productId={product._id}
              stock={product.stock}
              className="flex-1"
            />
            <WishlistButton productId={product._id} />
          </div>

          <Separator />

          {/* Full description */}
          <div>
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Reviews Section */}
      <Separator className="my-12" />
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <ReviewList productId={product._id} />
      </div>
    </div>
  );
}
