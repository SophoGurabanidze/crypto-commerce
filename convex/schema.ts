import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("admin")),
    defaultAddress: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        country: v.string(),
      })
    ),
    walletAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.number(),
    isActive: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_parentId", ["parentId"])
    .index("by_sortOrder", ["sortOrder"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
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
    averageRating: v.number(),
    reviewCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_categoryId", ["categoryId"])
    .index("by_productType", ["productType"])
    .index("by_isFeatured", ["isFeatured"])
    .index("by_isActive_createdAt", ["isActive", "createdAt"])
    .index("by_price", ["price"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["categoryId", "isActive", "productType"],
    }),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    addedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_productId", ["userId", "productId"]),

  orders: defineTable({
    orderNumber: v.string(),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
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
    shippingAddress: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        country: v.string(),
      })
    ),
    trackingNumber: v.optional(v.string()),
    trackingUrl: v.optional(v.string()),
    digitalDelivered: v.optional(v.boolean()),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_orderNumber", ["orderNumber"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_paymentMethod", ["paymentMethod"]),

  reviews: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    orderId: v.id("orders"),
    rating: v.number(),
    title: v.optional(v.string()),
    body: v.string(),
    isVerifiedPurchase: v.boolean(),
    isApproved: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_productId", ["productId"])
    .index("by_userId", ["userId"])
    .index("by_productId_isApproved", ["productId", "isApproved"])
    .index("by_isApproved", ["isApproved"]),

  wishlists: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    addedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_productId", ["userId", "productId"]),

  cryptoPayments: defineTable({
    orderId: v.id("orders"),
    method: v.union(
      v.literal("direct_transfer"),
      v.literal("escrow"),
      v.literal("stablecoin")
    ),
    fromAddress: v.string(),
    toAddress: v.string(),
    transactionHash: v.optional(v.string()),
    chainId: v.number(),
    tokenAddress: v.optional(v.string()),
    amountWei: v.string(),
    amountUsd: v.number(),
    ethPriceUsd: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("submitted"),
      v.literal("confirming"),
      v.literal("confirmed"),
      v.literal("failed"),
      v.literal("expired")
    ),
    confirmations: v.number(),
    requiredConfirmations: v.number(),
    escrowId: v.optional(v.string()),
    escrowStatus: v.optional(
      v.union(
        v.literal("funded"),
        v.literal("released"),
        v.literal("disputed"),
        v.literal("refunded")
      )
    ),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_transactionHash", ["transactionHash"])
    .index("by_status", ["status"]),

  emailLog: defineTable({
    userId: v.id("users"),
    orderId: v.optional(v.id("orders")),
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
    sentAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_orderId", ["orderId"]),
});
