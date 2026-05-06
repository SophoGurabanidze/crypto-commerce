import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, generateSlug } from "./lib/helpers";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_sortOrder")
      .collect();
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const all = await ctx.db
      .query("categories")
      .withIndex("by_sortOrder")
      .collect();
    return all.filter((c) => c.isActive);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const slug = generateSlug(args.name);
    return await ctx.db.insert("categories", { ...args, slug });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...args }) => {
    await requireAdmin(ctx);
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) updates[key] = value;
    }
    if (args.name) updates.slug = generateSlug(args.name);
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
