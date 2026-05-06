"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export const sendOrderConfirmation = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.runQuery(api.orders.getById, { id: orderId });
    if (!order) return;

    const itemsList = order.items
      .map(
        (item: { productName: string; quantity: number; price: number }) =>
          `${item.productName} x${item.quantity} - $${((item.price * item.quantity) / 100).toFixed(2)}`
      )
      .join("\n");

    try {
      const resend = getResend();
      const result = await resend.emails.send({
        from: "CryptoShop <orders@resend.dev>",
        to: "customer@example.com",
        subject: `Order Confirmed: ${order.orderNumber}`,
        html: `
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase. Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
          <pre>${itemsList}</pre>
          <p><strong>Total: $${(order.total / 100).toFixed(2)}</strong></p>
          <p>Payment: ${order.paymentMethod}</p>
        `,
      });

      await ctx.runMutation(internal.emailLog.logEmail, {
        userId: order.userId,
        orderId,
        emailType: "order_confirmation",
        to: "customer@example.com",
        resendId: result.data?.id,
        status: result.error ? "failed" : "sent",
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  },
});

export const sendShippingUpdate = internalAction({
  args: {
    orderId: v.id("orders"),
    trackingNumber: v.string(),
    trackingUrl: v.optional(v.string()),
  },
  handler: async (ctx, { orderId, trackingNumber, trackingUrl }) => {
    const order = await ctx.runQuery(api.orders.getById, { id: orderId });
    if (!order) return;

    try {
      const resend = getResend();
      await resend.emails.send({
        from: "CryptoShop <orders@resend.dev>",
        to: "customer@example.com",
        subject: `Shipping Update: ${order.orderNumber}`,
        html: `
          <h1>Your Order Has Shipped!</h1>
          <p>Order <strong>${order.orderNumber}</strong> is on its way.</p>
          <p>Tracking: <strong>${trackingNumber}</strong></p>
          ${trackingUrl ? `<p><a href="${trackingUrl}">Track your package</a></p>` : ""}
        `,
      });
    } catch (error) {
      console.error("Failed to send shipping email:", error);
    }
  },
});
