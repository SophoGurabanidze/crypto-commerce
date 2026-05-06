import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, decodeEventLog } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

// The NFT contract ABI — function + event we need
const MINT_RECEIPT_ABI = [
  {
    name: "mintReceipt",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "orderId", type: "string" },
      { name: "tokenURI", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "ReceiptMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "orderId", type: "string", indexed: false },
    ],
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const { orderId, buyerAddress, orderDetails } = await req.json();

    if (!orderId || !buyerAddress) {
      return NextResponse.json(
        { error: "Missing orderId or buyerAddress" },
        { status: 400 }
      );
    }

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    const nftAddress = process.env.NEXT_PUBLIC_SOPHO_NFT_ADDRESS;
    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

    if (!privateKey || !nftAddress || !rpcUrl) {
      return NextResponse.json(
        { error: "Server not configured for NFT minting" },
        { status: 500 }
      );
    }

    // Build the NFT metadata JSON
    // In production, you'd upload this to IPFS. For now, we use a data URI.
    const metadata = {
      name: `Purchase Receipt #${orderId.slice(-6)}`,
      description: `Official purchase receipt from CryptoShop`,
      image: "https://placehold.co/400x400/1a1a2e/ffffff?text=RECEIPT",
      attributes: [
        { trait_type: "Type", value: "Purchase Receipt" },
        { trait_type: "Order ID", value: orderId },
        { trait_type: "Date", value: new Date().toISOString().split("T")[0] },
        ...(orderDetails?.total
          ? [{ trait_type: "Total", value: `$${(orderDetails.total / 100).toFixed(2)}` }]
          : []),
        ...(orderDetails?.items
          ? [{ trait_type: "Items", value: String(orderDetails.items) }]
          : []),
      ],
    };

    // Encode metadata as a data URI (base64 JSON)
    const tokenURI =
      "data:application/json;base64," +
      Buffer.from(JSON.stringify(metadata)).toString("base64");

    // Create a wallet client using the deployer's private key
    const account = privateKeyToAccount(
      (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as `0x${string}`
    );

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    // Call mintReceipt on the NFT contract
    const hash = await walletClient.writeContract({
      address: nftAddress as `0x${string}`,
      abi: MINT_RECEIPT_ABI,
      functionName: "mintReceipt",
      args: [buyerAddress as `0x${string}`, orderId, tokenURI],
    });

    // Wait for the transaction to be confirmed
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Parse the ReceiptMinted event to extract tokenId
    let tokenId: string | null = null;
    for (const log of receipt.logs) {
      try {
        const event = decodeEventLog({
          abi: MINT_RECEIPT_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (event.eventName === "ReceiptMinted") {
          tokenId = String(event.args.tokenId);
          break;
        }
      } catch {
        // Not our event, skip
      }
    }

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: Number(receipt.blockNumber),
      tokenId,
    });
  } catch (error) {
    console.error("NFT minting error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Minting failed" },
      { status: 500 }
    );
  }
}
