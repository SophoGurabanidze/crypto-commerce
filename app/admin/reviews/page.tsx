"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/star-rating";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const reviews = useQuery(api.reviews.getPending);
  const approve = useMutation(api.reviews.approve);
  const reject = useMutation(api.reviews.reject);

  const handleApprove = async (id: Id<"reviews">) => {
    await approve({ id });
    toast.success("Review approved");
  };

  const handleReject = async (id: Id<"reviews">) => {
    await reject({ id });
    toast.success("Review rejected");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Review Moderation</h1>

      {reviews === undefined ? (
        <p>Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews pending approval.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{review.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      on {review.productName}
                    </p>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.title && (
                  <p className="font-medium text-sm">{review.title}</p>
                )}
                <p className="text-sm">{review.body}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(review._id)}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(review._id)}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
