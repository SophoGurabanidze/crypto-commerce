import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAdmin } from "./lib/helpers";

export const getByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_productId_isApproved", (q) =>
        q.eq("productId", productId).eq("isApproved", true)
      )
      .order("desc")
      .collect();

    // Enrich with user info
    return await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        return {
          ...review,
          userName: user?.name ?? "Anonymous",
          userImage: user?.imageUrl,
        };
      })
    );
  },
});

export const getByUser = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return await ctx.db
      .query("reviews")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const getPending = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_isApproved", (q) => q.eq("isApproved", false))
      .collect();

    return await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        const product = await ctx.db.get(review.productId);
        return {
          ...review,
          userName: user?.name ?? "Anonymous",
          productName: product?.name ?? "Unknown",
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    orderId: v.id("orders"),
    rating: v.number(),
    title: v.optional(v.string()),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify the user has a delivered order with this product
    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== user._id) {
      throw new Error("Order not found");
    }
    if (order.status !== "delivered") {
      throw new Error("Order must be delivered before reviewing");
    }
    const hasProduct = order.items.some(
      (item) => item.productId === args.productId
    );
    if (!hasProduct) {
      throw new Error("Product not in this order");
    }

    // Check for existing review
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    const alreadyReviewed = existing.some(
      (r) => r.productId === args.productId
    );
    if (alreadyReviewed) {
      throw new Error("You already reviewed this product");
    }

    const now = Date.now();
    const reviewId = await ctx.db.insert("reviews", {
      userId: user._id,
      productId: args.productId,
      orderId: args.orderId,
      rating: Math.min(5, Math.max(1, Math.round(args.rating))),
      title: args.title,
      body: args.body,
      isVerifiedPurchase: true,
      isApproved: false, // Requires admin approval
      createdAt: now,
      updatedAt: now,
    });

    return reviewId;
  },
});

export const approve = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const review = await ctx.db.get(id);
    if (!review) throw new Error("Review not found");

    await ctx.db.patch(id, { isApproved: true });

    // Update product rating aggregate
    const allReviews = await ctx.db
      .query("reviews")
      .withIndex("by_productId_isApproved", (q) =>
        q.eq("productId", review.productId).eq("isApproved", true)
      )
      .collect();

    // Include the newly approved review
    const ratings = [...allReviews.map((r) => r.rating), review.rating];
    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

    await ctx.db.patch(review.productId, {
      averageRating: Math.round(avg * 10) / 10,
      reviewCount: ratings.length,
    });
  },
});

export const reject = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

export const remove = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, { id }) => {
    const user = await requireAuth(ctx);
    const review = await ctx.db.get(id);
    if (!review || review.userId !== user._id) throw new Error("Not found");

    await ctx.db.delete(id);

    // Recalculate product ratings
    const remaining = await ctx.db
      .query("reviews")
      .withIndex("by_productId_isApproved", (q) =>
        q.eq("productId", review.productId).eq("isApproved", true)
      )
      .collect();

    const avg =
      remaining.length > 0
        ? remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length
        : 0;

    await ctx.db.patch(review.productId, {
      averageRating: Math.round(avg * 10) / 10,
      reviewCount: remaining.length,
    });
  },
});
