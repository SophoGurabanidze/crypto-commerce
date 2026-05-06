import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const logEmail = internalMutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
    emailType: v.union(
      v.literal("order_confirmation"),
      v.literal("payment_received"),
      v.literal("shipping_update"),
      v.literal("delivery_confirmation"),
      v.literal("digital_delivery"),
      v.literal("review_request"),
      v.literal("refund_notification")
    ),
    to: v.string(),
    resendId: v.optional(v.string()),
    status: v.union(v.literal("sent"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailLog", {
      ...args,
      sentAt: Date.now(),
    });
  },
});
