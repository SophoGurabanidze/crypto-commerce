"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

export function ProductCard({ product }: { product: Doc<"products"> }) {
  const imageUrl = useQuery(
    api.files.getFileUrl,
    product.images[0] ? { storageId: product.images[0] } : "skip"
  );

  return (
    <Link href={`/products/${product._id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square relative bg-muted overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <Badge className="absolute top-2 left-2" variant="destructive">
              Sale
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              Out of Stock
            </Badge>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-medium line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="font-bold">${(product.price / 100).toFixed(2)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                ${(product.compareAtPrice / 100).toFixed(2)}
              </span>
            )}
          </div>
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span>{product.averageRating.toFixed(1)}</span>
              <span>({product.reviewCount})</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {product.productType === "digital" ? "Digital" : "Physical"}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </CardContent>
    </Card>
  );
}
