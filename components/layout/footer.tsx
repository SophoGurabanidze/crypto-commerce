import Link from "next/link";
import { Store } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Store className="h-5 w-5" />
              CryptoShop
            </div>
            <p className="text-sm text-muted-foreground">
              Modern e-commerce with traditional and crypto payments.
            </p>
          </div>

          {/* Shop */}
          <div className="space-y-3">
            <h3 className="font-semibold">Shop</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/products" className="hover:text-foreground transition-colors">
                All Products
              </Link>
              <Link href="/categories" className="hover:text-foreground transition-colors">
                Categories
              </Link>
              <Link href="/search" className="hover:text-foreground transition-colors">
                Search
              </Link>
            </nav>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h3 className="font-semibold">Account</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/orders" className="hover:text-foreground transition-colors">
                My Orders
              </Link>
              <Link href="/wishlist" className="hover:text-foreground transition-colors">
                Wishlist
              </Link>
              <Link href="/profile" className="hover:text-foreground transition-colors">
                Profile
              </Link>
            </nav>
          </div>

          {/* Payments */}
          <div className="space-y-3">
            <h3 className="font-semibold">Payments</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>Stripe (Cards)</span>
              <span>ETH Direct Transfer</span>
              <span>Smart Contract Escrow</span>
              <span>USDC / USDT</span>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CryptoShop. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
