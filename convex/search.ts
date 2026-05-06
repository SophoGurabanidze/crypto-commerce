import { v } from "convex/values";
import { query } from "./_generated/server";

export const searchProducts = query({
  args: {
    query: v.string(),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    return await ctx.db
      .query("products")
      .withSearchIndex("search_name", (q) => {
        let search = q.search("name", args.query).eq("isActive", true);
        if (args.categoryId) {
          search = search.eq("categoryId", args.categoryId);
        }
        return search;
      })
      .take(20);
  },
});
