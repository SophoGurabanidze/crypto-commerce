"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StarRating } from "./star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function ReviewList({ productId }: { productId: Id<"products"> }) {
  const reviews = useQuery(api.reviews.getByProduct, { productId });

  if (reviews === undefined) return <p className="text-sm">Loading reviews...</p>;
  if (reviews.length === 0) return <p className="text-sm text-muted-foreground">No reviews yet.</p>;

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review._id} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={review.userImage} />
              <AvatarFallback>
                {review.userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{review.userName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
            {review.isVerifiedPurchase && (
              <Badge variant="outline" className="text-xs ml-auto">
                Verified Purchase
              </Badge>
            )}
          </div>
          <StarRating rating={review.rating} size="sm" />
          {review.title && <p className="font-medium text-sm">{review.title}</p>}
          <p className="text-sm text-muted-foreground">{review.body}</p>
        </div>
      ))}
    </div>
  );
}
