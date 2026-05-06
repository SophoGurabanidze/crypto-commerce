import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, decodeEventLog } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const MINT_AUTHENTICITY_ABI = [
  {
    name: "mintAuthenticity",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "productId", type: "string" },
      { name: "tokenURI", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "AuthenticityMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "productId", type: "string", indexed: false },
    ],
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const { productId, productName, buyerAddress } = await req.json();

    if (!productId || !buyerAddress) {
      return NextResponse.json(
        { error: "Missing productId or buyerAddress" },
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

    const metadata = {
      name: `Authenticity Certificate: ${productName ?? "Product"}`,
      description: "On-chain proof that this product was purchased from CryptoShop.",
      image: "https://placehold.co/400x400/0f172a/ffffff?text=AUTHENTIC",
      attributes: [
        { trait_type: "Type", value: "Authenticity Certificate" },
        { trait_type: "Product ID", value: String(productId) },
        { trait_type: "Issued At", value: new Date().toISOString() },
      ],
    };

    const tokenURI =
      "data:application/json;base64," +
      Buffer.from(JSON.stringify(metadata)).toString("base64");

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

    const hash = await walletClient.writeContract({
      address: nftAddress as `0x${string}`,
      abi: MINT_AUTHENTICITY_ABI,
      functionName: "mintAuthenticity",
      args: [buyerAddress as `0x${string}`, String(productId), tokenURI],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    let tokenId: string | null = null;
    for (const log of receipt.logs) {
      try {
        const event = decodeEventLog({
          abi: MINT_AUTHENTICITY_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (event.eventName === "AuthenticityMinted") {
          tokenId = String(event.args.tokenId);
          break;
        }
      } catch {
        // Not our event
      }
    }

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: Number(receipt.blockNumber),
      tokenId,
      productId: String(productId),
    });
  } catch (error) {
    console.error("Authenticity minting error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Minting failed" },
      { status: 500 }
    );
  }
}
