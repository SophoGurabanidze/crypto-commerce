"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
} from "lucide-react";

const METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe",
  crypto_eth: "ETH Direct",
  crypto_escrow: "Escrow",
  crypto_stablecoin: "Stablecoin",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  refunded: "bg-red-100 text-red-800",
};

export default function AnalyticsPage() {
  const stats = useQuery(api.analytics.getDashboardStats);

  if (!stats) return <p>Loading analytics...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalRevenue / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Revenue (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.monthlyRevenue.map((m) => (
              <div key={m.month} className="flex items-center gap-4">
                <span className="w-24 text-sm text-muted-foreground">
                  {m.month}
                </span>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${
                        stats.totalRevenue > 0
                          ? (m.revenue / stats.totalRevenue) * 100
                          : 0
                      }%`,
                      minWidth: m.revenue > 0 ? "2rem" : "0",
                    }}
                  />
                </div>
                <span className="w-28 text-sm text-right font-medium">
                  ${(m.revenue / 100).toFixed(2)}
                </span>
                <span className="w-16 text-xs text-muted-foreground text-right">
                  {m.orders} orders
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      STATUS_COLORS[status] || ""
                    }`}
                  >
                    {status}
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {Object.keys(stats.ordersByStatus).length === 0 && (
                <p className="text-sm text-muted-foreground">No orders yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.revenueByMethod).map(
                ([method, revenue]) => (
                  <div
                    key={method}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {METHOD_LABELS[method] || method}
                    </span>
                    <span className="font-medium">
                      ${(revenue / 100).toFixed(2)}
                    </span>
                  </div>
                )
              )}
              {Object.keys(stats.revenueByMethod).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No revenue data yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Order</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Method</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order._id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">
                        {order.orderNumber}
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            STATUS_COLORS[order.status] || ""
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2">
                        {METHOD_LABELS[order.paymentMethod] ||
                          order.paymentMethod}
                      </td>
                      <td className="py-2 text-right font-medium">
                        ${(order.total / 100).toFixed(2)}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
