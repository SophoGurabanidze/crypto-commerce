import { query } from "./_generated/server";
import { requireAdmin } from "./lib/helpers";

export const getDashboardStats = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allOrders = await ctx.db.query("orders").collect();
    const products = await ctx.db.query("products").collect();
    const users = await ctx.db.query("users").collect();

    const paidStatuses = ["paid", "processing", "shipped", "delivered"];
    const paidOrders = allOrders.filter((o) => paidStatuses.includes(o.status));

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = allOrders.length;
    const totalCustomers = users.filter((u) => u.role === "customer").length;
    const activeProducts = products.filter((p) => p.isActive).length;

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    for (const order of allOrders) {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    }

    // Revenue by payment method
    const revenueByMethod: Record<string, number> = {};
    for (const order of paidOrders) {
      const method = order.paymentMethod;
      revenueByMethod[method] = (revenueByMethod[method] || 0) + order.total;
    }

    // Recent orders (last 10)
    const recentOrders = allOrders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
      }));

    // Monthly revenue (last 6 months)
    const now = new Date();
    const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = d.getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const monthLabel = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      const monthOrders = paidOrders.filter(
        (o) => o.createdAt >= monthStart && o.createdAt < monthEnd
      );
      monthlyRevenue.push({
        month: monthLabel,
        revenue: monthOrders.reduce((sum, o) => sum + o.total, 0),
        orders: monthOrders.length,
      });
    }

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      activeProducts,
      ordersByStatus,
      revenueByMethod,
      recentOrders,
      monthlyRevenue,
    };
  },
});
