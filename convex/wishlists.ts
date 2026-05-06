import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, getCurrentUser } from "./lib/helpers";

export const getByUser = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const items = await ctx.db
      .query("wishlists")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // Enrich with product data
    const products = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return product && product.isActive ? product : null;
      })
    );

    return products.filter(Boolean);
  },
});

export const isWishlisted = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;
    const item = await ctx.db
      .query("wishlists")
      .withIndex("by_userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", productId)
      )
      .unique();
    return !!item;
  },
});

export const toggle = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const user = await requireAuth(ctx);
    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", productId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false; // removed
    }

    await ctx.db.insert("wishlists", {
      userId: user._id,
      productId,
      addedAt: Date.now(),
    });
    return true; // added
  },
});
