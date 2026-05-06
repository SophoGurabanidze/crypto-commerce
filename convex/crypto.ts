"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const verifyTransaction = action({
  args: {
    transactionHash: v.string(),
    orderId: v.id("orders"),
    expectedTo: v.string(),
    expectedValueWei: v.optional(v.string()),
  },
  handler: async (ctx, { transactionHash, orderId, expectedTo }) => {
    const { createPublicClient, http } = await import("viem");
    const { mainnet } = await import("viem/chains");

    const client = createPublicClient({
      chain: mainnet,
      transport: http(process.env.ETH_RPC_URL),
    });

    const receipt = await client.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

    if (receipt.status === "success") {
      const tx = await client.getTransaction({
        hash: transactionHash as `0x${string}`,
      });

      // Verify the recipient
      if (tx.to?.toLowerCase() === expectedTo.toLowerCase()) {
        await ctx.runMutation(api.orders.markPaid, {
          id: orderId,
          paymentDetails: {
            transactionHash,
            walletAddress: expectedTo,
            tokenSymbol: "ETH",
            amountInToken: tx.value.toString(),
          },
        });
        return { verified: true };
      }
    }

    return { verified: false };
  },
});
