import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuth, requireAdmin } from "./lib/helpers";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "refunded"],
  processing: ["shipped", "delivered", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export const create = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        productImage: v.optional(v.id("_storage")),
        price: v.number(),
        quantity: v.number(),
        productType: v.union(v.literal("physical"), v.literal("digital")),
        hasAuthCertificate: v.optional(v.boolean()),
      })
    ),
    subtotal: v.number(),
    shippingCost: v.number(),
    tax: v.number(),
    total: v.number(),
    paymentMethod: v.union(
      v.literal("stripe"),
      v.literal("crypto_eth"),
      v.literal("crypto_escrow"),
      v.literal("crypto_stablecoin")
    ),
    shippingAddress: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        country: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Generate order number
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${random}`;

    // Decrement stock for each item
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`Product ${item.productName} not found`);
      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${item.productName}`);
      }
      await ctx.db.patch(item.productId, {
        stock: product.stock - item.quantity,
      });
    }

    const orderId = await ctx.db.insert("orders", {
      orderNumber,
      userId: user._id,
      status: "pending",
      items: args.items,
      subtotal: args.subtotal,
      shippingCost: args.shippingCost,
      tax: args.tax,
      total: args.total,
      paymentMethod: args.paymentMethod,
      paymentDetails: {},
      shippingAddress: args.shippingAddress,
      createdAt: Date.now(),
    });

    return orderId;
  },
});

export const getByUser = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getAll = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled"),
        v.literal("refunded")
      )
    ),
  },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    if (status) {
      return await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("orders").order("desc").collect();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    trackingNumber: v.optional(v.string()),
    trackingUrl: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, trackingNumber, trackingUrl }) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(id);
    if (!order) throw new Error("Order not found");

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed?.includes(status)) {
      throw new Error(
        `Cannot transition from ${order.status} to ${status}`
      );
    }

    const updates: Record<string, unknown> = { status };

    if (status === "paid") updates.paidAt = Date.now();
    if (status === "shipped") {
      updates.shippedAt = Date.now();
      if (trackingNumber) updates.trackingNumber = trackingNumber;
      if (trackingUrl) updates.trackingUrl = trackingUrl;
    }
    if (status === "delivered") updates.deliveredAt = Date.now();
    if (status === "cancelled") {
      updates.cancelledAt = Date.now();
      // Restore stock
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId);
        if (product) {
          await ctx.db.patch(item.productId, {
            stock: product.stock + item.quantity,
          });
        }
      }
    }
    if (status === "refunded") {
      // Restore stock
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId);
        if (product) {
          await ctx.db.patch(item.productId, {
            stock: product.stock + item.quantity,
          });
        }
      }
    }

    await ctx.db.patch(id, updates);

    // Trigger email notifications
    if (status === "shipped" && trackingNumber) {
      await ctx.scheduler.runAfter(0, internal.email.sendShippingUpdate, {
        orderId: id,
        trackingNumber,
        trackingUrl,
      });
    }
    if (status === "paid") {
      await ctx.scheduler.runAfter(0, internal.email.sendOrderConfirmation, {
        orderId: id,
      });
    }
  },
});

export const markPaid = mutation({
  args: {
    id: v.id("orders"),
    paymentDetails: v.object({
      stripeSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      transactionHash: v.optional(v.string()),
      walletAddress: v.optional(v.string()),
      chainId: v.optional(v.number()),
      escrowContractAddress: v.optional(v.string()),
      tokenSymbol: v.optional(v.string()),
      amountInToken: v.optional(v.string()),
      ethPriceAtPurchase: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { id, paymentDetails }) => {
    const order = await ctx.db.get(id);
    if (!order) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Order is not pending");

    const updates: Record<string, unknown> = {
      status: "paid",
      paidAt: Date.now(),
      paymentDetails,
    };

    // Auto-deliver digital-only orders
    const allDigital = order.items.every(
      (item) => item.productType === "digital"
    );
    if (allDigital) {
      updates.status = "delivered";
      updates.deliveredAt = Date.now();
      updates.digitalDelivered = true;
    }

    await ctx.db.patch(id, updates);

    // Keep checkout behavior consistent across payment methods by clearing the
    // buyer's cart once payment is finalized.
    await ctx.runMutation(internal.cart.clearCartByUserId, {
      userId: order.userId,
    });

    // Send order confirmation email
    await ctx.scheduler.runAfter(0, internal.email.sendOrderConfirmation, {
      orderId: id,
    });
  },
});

export const countPaidByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return orders.filter((order) =>
      order.status === "paid" ||
      order.status === "processing" ||
      order.status === "shipped" ||
      order.status === "delivered"
    ).length;
  },
});
