"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setProductCategory, setProductType } from "@/lib/store/ui-slice";

export function ProductFilters() {
  const categories = useQuery(api.categories.listActive);
  const selectedCategory = useAppSelector((state) => state.ui.productCategoryId);
  const selectedType = useAppSelector((state) => state.ui.productType);
  const dispatch = useAppDispatch();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-1">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => dispatch(setProductCategory(null))}
          >
            All Categories
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat._id}
              variant={selectedCategory === cat._id ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => dispatch(setProductCategory(cat._id))}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Product Type</h3>
        <div className="space-y-1">
          <Button
            variant={selectedType === null ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => dispatch(setProductType(null))}
          >
            All Types
          </Button>
          <Button
            variant={selectedType === "physical" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => dispatch(setProductType("physical"))}
          >
            Physical
          </Button>
          <Button
            variant={selectedType === "digital" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => dispatch(setProductType("digital"))}
          >
            Digital
          </Button>
        </div>
      </div>
    </div>
  );
}
