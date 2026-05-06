import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  decodeEventLog,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { SOPHO_NFT_ABI } from "@/lib/web3/contracts";

const MINT_LOYALTY_ABI = [
  {
    name: "mintOrUpgradeLoyalty",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tier", type: "uint8" },
      { name: "tokenURI", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "LoyaltyMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "holder", type: "address", indexed: true },
      { name: "tier", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "LoyaltyUpgraded",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "oldTier", type: "uint8", indexed: false },
      { name: "newTier", type: "uint8", indexed: false },
    ],
  },
] as const;

const TIER_NAMES: Record<number, string> = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
};

const TIER_IMAGES: Record<number, string> = {
  1: "https://placehold.co/400x400/92400e/ffffff?text=BRONZE",
  2: "https://placehold.co/400x400/475569/ffffff?text=SILVER",
  3: "https://placehold.co/400x400/a16207/ffffff?text=GOLD",
};

export async function POST(req: NextRequest) {
  try {
    const { buyerAddress, tier, orderCount } = await req.json();

    if (!buyerAddress || !tier || tier < 1 || tier > 3) {
      return NextResponse.json(
        { error: "Missing or invalid buyerAddress/tier" },
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

    const currentTier = Number(
      await publicClient.readContract({
        address: nftAddress as `0x${string}`,
        abi: SOPHO_NFT_ABI,
        functionName: "getLoyaltyTier",
        args: [buyerAddress as `0x${string}`],
      })
    );

    if (currentTier >= tier) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Tier already minted or higher",
        currentTier,
      });
    }

    const tierName = TIER_NAMES[tier] ?? "Bronze";
    const metadata = {
      name: `${tierName} Loyalty Membership`,
      description: `CryptoShop loyalty membership NFT (${orderCount} qualifying orders).`,
      image: TIER_IMAGES[tier] ?? TIER_IMAGES[1],
      attributes: [
        { trait_type: "Type", value: "Loyalty" },
        { trait_type: "Tier", value: tierName },
        { trait_type: "Order Count", value: String(orderCount ?? 0) },
      ],
    };

    const tokenURI =
      "data:application/json;base64," +
      Buffer.from(JSON.stringify(metadata)).toString("base64");

    const hash = await walletClient.writeContract({
      address: nftAddress as `0x${string}`,
      abi: MINT_LOYALTY_ABI,
      functionName: "mintOrUpgradeLoyalty",
      args: [buyerAddress as `0x${string}`, Number(tier), tokenURI],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    let tokenId: string | null = null;
    let upgraded = false;
    for (const log of receipt.logs) {
      try {
        const event = decodeEventLog({
          abi: MINT_LOYALTY_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (event.eventName === "LoyaltyMinted") {
          tokenId = String(event.args.tokenId);
        }
        if (event.eventName === "LoyaltyUpgraded") {
          tokenId = String(event.args.tokenId);
          upgraded = true;
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
      tier,
      tierName,
      upgraded,
    });
  } catch (error) {
    console.error("Loyalty minting error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Minting failed" },
      { status: 500 }
    );
  }
}
