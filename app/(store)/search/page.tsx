"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/product-grid";
import { useDebounce } from "@/hooks/use-debounce";
import { Search } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const results = useQuery(
    api.search.searchProducts,
    debouncedQuery.trim() ? { query: debouncedQuery.trim() } : "skip"
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search</h1>

      <div className="relative max-w-lg mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="pl-10"
          autoFocus
        />
      </div>

      {!debouncedQuery.trim() ? (
        <p className="text-muted-foreground text-center py-12">
          Start typing to search products.
        </p>
      ) : results === undefined ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} result{results.length !== 1 && "s"} for &quot;{debouncedQuery}&quot;
          </p>
          <ProductGrid products={results} />
        </>
      )}
    </div>
  );
}
