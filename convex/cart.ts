import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser, requireAuth } from "./lib/helpers";

export const getCartItems = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const enriched = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product) return null;
        const imageUrl = product.images[0]
          ? await ctx.storage.getUrl(product.images[0])
          : null;
        return {
          ...item,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            productType: product.productType,
            hasAuthCertificate: product.hasAuthCertificate ?? false,
            imageUrl,
          },
        };
      })
    );

    return enriched.filter(Boolean);
  },
});

export const getCartCount = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
});

export const addItem = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, { productId, quantity = 1 }) => {
    const user = await requireAuth(ctx);
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");
    if (!product.isActive) throw new Error("Product is not available");
    if (product.stock < quantity) throw new Error("Not enough stock");

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", productId)
      )
      .unique();

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) throw new Error("Not enough stock");
      await ctx.db.patch(existing._id, { quantity: newQty });
      return existing._id;
    }

    return await ctx.db.insert("cartItems", {
      userId: user._id,
      productId,
      quantity,
      addedAt: Date.now(),
    });
  },
});

export const updateQuantity = mutation({
  args: {
    itemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, { itemId, quantity }) => {
    const user = await requireAuth(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== user._id) throw new Error("Item not found");

    if (quantity <= 0) {
      await ctx.db.delete(itemId);
      return;
    }

    const product = await ctx.db.get(item.productId);
    if (!product || quantity > product.stock) throw new Error("Not enough stock");

    await ctx.db.patch(itemId, { quantity });
  },
});

export const removeItem = mutation({
  args: { itemId: v.id("cartItems") },
  handler: async (ctx, { itemId }) => {
    const user = await requireAuth(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== user._id) throw new Error("Item not found");
    await ctx.db.delete(itemId);
  },
});

export const clearCart = mutation({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    await Promise.all(items.map((item) => ctx.db.delete(item._id)));
  },
});

export const clearCartByUserId = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(items.map((item) => ctx.db.delete(item._id)));
  },
});
