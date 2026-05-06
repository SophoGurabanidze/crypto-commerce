"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductImages({ imageIds }: { imageIds: Id<"_storage">[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const imageUrls = useQuery(api.files.getMultipleFileUrls, {
    storageIds: imageIds,
  });

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        No Images
      </div>
    );
  }

  const mainImage = imageUrls[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
        {mainImage?.url && (
          <Image
            src={mainImage.url}
            alt="Product image"
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Thumbnails */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {imageUrls.map((img, index) => (
            <button
              key={img.storageId}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0",
                selectedIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              {img.url && (
                <Image
                  src={img.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
