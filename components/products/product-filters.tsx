"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Id } from "@/convex/_generated/dataModel";

interface ProductFiltersProps {
  selectedCategory: Id<"categories"> | null;
  selectedType: "physical" | "digital" | null;
  onCategoryChange: (id: Id<"categories"> | null) => void;
  onTypeChange: (type: "physical" | "digital" | null) => void;
}

export function ProductFilters({
  selectedCategory,
  selectedType,
  onCategoryChange,
  onTypeChange,
}: ProductFiltersProps) {
  const categories = useQuery(api.categories.listActive);

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-1">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onCategoryChange(null)}
          >
            All Categories
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat._id}
              variant={selectedCategory === cat._id ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => onCategoryChange(cat._id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Product Type */}
      <div>
        <h3 className="font-semibold mb-3">Product Type</h3>
        <div className="space-y-1">
          <Button
            variant={selectedType === null ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onTypeChange(null)}
          >
            All Types
          </Button>
          <Button
            variant={selectedType === "physical" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onTypeChange("physical")}
          >
            Physical
          </Button>
          <Button
            variant={selectedType === "digital" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onTypeChange("digital")}
          >
            Digital
          </Button>
        </div>
      </div>
    </div>
  );
}
