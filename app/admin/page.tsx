"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Star,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const stats = useQuery(api.analytics.getDashboardStats);
  const pendingReviews = useQuery(api.reviews.getPending);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `$${(stats.totalRevenue / 100).toFixed(2)}` : "..."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalOrders ?? "..."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeProducts ?? "..."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalCustomers ?? "..."}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.recentOrders.length ? (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <Link
                    key={order._id}
                    href={`/admin/orders/${order._id}`}
                    className="flex items-center justify-between py-1 hover:bg-muted rounded px-2 -mx-2"
                  >
                    <span className="text-sm font-mono">
                      {order.orderNumber}
                    </span>
                    <span className="text-sm font-medium">
                      ${(order.total / 100).toFixed(2)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/admin/orders"
              className="text-sm text-primary mt-3 inline-block"
            >
              View all orders
            </Link>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingReviews?.length ? (
              <p className="text-sm text-muted-foreground">
                No reviews pending approval
              </p>
            ) : (
              <div className="space-y-2">
                {pendingReviews.slice(0, 5).map((review) => (
                  <div key={review._id} className="text-sm">
                    <span className="font-medium">{review.userName}</span>
                    <span className="text-muted-foreground">
                      {" "}on {review.productName}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/admin/reviews"
              className="text-sm text-primary mt-3 inline-block"
            >
              Moderate reviews
            </Link>
          </CardContent>
        </Card>
      </div>

      <Link
        href="/admin/analytics"
        className="text-sm text-primary inline-block"
      >
        View detailed analytics
      </Link>
    </div>
  );
}
