import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, generateSlug } from "./lib/helpers";

export const list = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    productType: v.optional(v.union(v.literal("physical"), v.literal("digital"))),
    onlyActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.categoryId) {
      results = await ctx.db
        .query("products")
        .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId!))
        .collect();
    } else {
      results = await ctx.db.query("products").collect();
    }

    if (args.onlyActive !== false) {
      results = results.filter((p) => p.isActive);
    }
    if (args.productType) {
      results = results.filter((p) => p.productType === args.productType);
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getFeatured = query({
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_isFeatured", (q) => q.eq("isFeatured", true))
      .collect();
    return products.filter((p) => p.isActive);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    categoryId: v.id("categories"),
    productType: v.union(v.literal("physical"), v.literal("digital")),
    weight: v.optional(v.number()),
    digitalFileId: v.optional(v.id("_storage")),
    images: v.array(v.id("_storage")),
    stock: v.number(),
    sku: v.optional(v.string()),
    isFeatured: v.boolean(),
    hasAuthCertificate: v.optional(v.boolean()),
    isActive: v.boolean(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const slug = generateSlug(args.name);
    const now = Date.now();
    return await ctx.db.insert("products", {
      ...args,
      slug,
      averageRating: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    price: v.optional(v.number()),
    compareAtPrice: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    productType: v.optional(v.union(v.literal("physical"), v.literal("digital"))),
    weight: v.optional(v.number()),
    digitalFileId: v.optional(v.id("_storage")),
    images: v.optional(v.array(v.id("_storage"))),
    stock: v.optional(v.number()),
    sku: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    hasAuthCertificate: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...args }) => {
    await requireAdmin(ctx);
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) updates[key] = value;
    }
    if (args.name) updates.slug = generateSlug(args.name);
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
