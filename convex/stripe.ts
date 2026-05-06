"use node";

import Stripe from "stripe";
import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export const createCheckoutSession = action({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.runQuery(api.orders.getById, { id: orderId });
    if (!order) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Order is not pending");

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productName,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if applicable
    if (order.shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping" },
          unit_amount: order.shippingCost,
        },
        quantity: 1,
      });
    }

    // Add tax as a line item if applicable
    if (order.tax > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Tax" },
          unit_amount: order.tax,
        },
        quantity: 1,
      });
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success?orderId=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout?cancelled=true`,
      metadata: {
        orderId: orderId,
      },
    });

    return session.url;
  },
});

export const handleWebhook = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, { body, signature }) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      throw new Error("Invalid webhook signature");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId as Id<"orders">;

      if (orderId) {
        // Webhooks can be delivered multiple times, so guard against duplicates.
        const order = await ctx.runQuery(api.orders.getById, { id: orderId });
        if (!order) return;

        if (order.status === "pending") {
          await ctx.runMutation(api.orders.markPaid, {
            id: orderId,
            paymentDetails: {
              stripeSessionId: session.id,
              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.payment_intent?.id,
            },
          });
        }

        // Webhooks run without user auth context, so clear cart by user id.
        await ctx.runMutation(internal.cart.clearCartByUserId, {
          userId: order.userId,
        });
      }
    }
  },
});
