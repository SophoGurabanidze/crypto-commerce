"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, ShoppingBag, Heart, ImageIcon } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const convexUser = useQuery(api.users.currentUser);
  const orders = useQuery(api.orders.getByUser);

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {user.imageUrl && (
              <img
                src={user.imageUrl}
                alt=""
                className="h-12 w-12 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{user.fullName}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          {convexUser?.role === "admin" && (
            <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
              Admin Account
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/orders">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{orders?.length ?? "..."}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/wishlist">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">View your</p>
                <p className="font-medium">Wishlist</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/nfts">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">View your</p>
                <p className="font-medium">NFT Collection</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {convexUser?.defaultAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {convexUser.defaultAddress.street}
              <br />
              {convexUser.defaultAddress.city},{" "}
              {convexUser.defaultAddress.state}{" "}
              {convexUser.defaultAddress.zipCode}
              <br />
              {convexUser.defaultAddress.country}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
