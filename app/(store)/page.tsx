"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/product-grid";
import { ArrowRight, CreditCard, Shield, Wallet } from "lucide-react";

export default function HomePage() {
  const featured = useQuery(api.products.getFeatured);
  const categories = useQuery(api.categories.listActive);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Shop with <span className="text-primary">Cards</span> or{" "}
          <span className="text-primary">Crypto</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          A modern e-commerce experience with traditional Stripe payments and
          Web3 crypto options — ETH transfers, smart contract escrow, and
          stablecoins.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/products">
            <Button size="lg">
              Browse Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button variant="outline" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/categories/${cat.slug}`}
                className="group p-6 rounded-lg border bg-card hover:shadow-md transition-shadow text-center"
              >
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link href="/products">
            <Button variant="ghost">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        {featured === undefined ? (
          <ProductGridSkeleton count={4} />
        ) : featured.length > 0 ? (
          <ProductGrid products={featured} />
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No featured products yet.
          </p>
        )}
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">
            Payment Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-3 p-6">
              <div className="p-3 rounded-full bg-primary/10">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Stripe Payments</h3>
              <p className="text-sm text-muted-foreground">
                Pay securely with credit cards, debit cards, and other
                traditional payment methods via Stripe.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 p-6">
              <div className="p-3 rounded-full bg-primary/10">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Crypto Payments</h3>
              <p className="text-sm text-muted-foreground">
                Send ETH directly, use USDC/USDT stablecoins, or connect your
                wallet via RainbowKit and MetaMask.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 p-6">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Escrow Protection</h3>
              <p className="text-sm text-muted-foreground">
                Smart contract escrow holds funds until delivery is confirmed,
                protecting both buyers and sellers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
