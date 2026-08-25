import { NextResponse } from "next/server";
import { createPublicClient, http, isAddress } from "viem";
import { sepolia } from "viem/chains";
import { SOPHO_NFT_ABI, SOPHO_TOKEN_ABI } from "@/lib/web3/contracts";

const NFT_TYPES = ["Receipt", "Authenticity", "Loyalty"] as const;
const LOYALTY_TIERS = ["None", "Bronze", "Silver", "Gold"] as const;

export type NftHolderAnalytics = {
  walletAddress: string;
  totalNfts: number;
  receiptCount: number;
  authenticityCount: number;
  loyaltyCount: number;
  loyaltyTier: string;
  sphBalance: string;
  tokenIds: number[];
};

export async function GET() {
  const nftAddress = process.env.NEXT_PUBLIC_SOPHO_NFT_ADDRESS;
  const sphAddress = process.env.NEXT_PUBLIC_SOPHO_TOKEN_ADDRESS;
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

  if (!nftAddress || !rpcUrl) {
    return NextResponse.json(
      { error: "Server not configured for NFT reading" },
      { status: 500 }
    );
  }

  if (!isAddress(nftAddress)) {
    return NextResponse.json(
      { error: "Invalid NFT contract address" },
      { status: 500 }
    );
  }

  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const nftParams = {
    address: nftAddress as `0x${string}`,
    abi: SOPHO_NFT_ABI,
  } as const;

  try {
    const totalMinted = await client.readContract({
      ...nftParams,
      functionName: "totalMinted",
    });

    const total = Number(totalMinted);
    if (total === 0) {
      return NextResponse.json([]);
    }

    // Batch ownerOf + nftData for all tokens
    const ownerCalls = Array.from({ length: total }, (_, i) => ({
      ...nftParams,
      functionName: "ownerOf" as const,
      args: [BigInt(i)] as const,
    }));
    const dataCalls = Array.from({ length: total }, (_, i) => ({
      ...nftParams,
      functionName: "nftData" as const,
      args: [BigInt(i)] as const,
    }));

    const [ownerResults, dataResults] = await Promise.all([
      client.multicall({ contracts: ownerCalls }),
      client.multicall({ contracts: dataCalls }),
    ]);

    // Group by owner
    const holderMap = new Map<
      string,
      {
        tokenIds: number[];
        receiptCount: number;
        authenticityCount: number;
        loyaltyCount: number;
        loyaltyTier: string;
      }
    >();

    for (let i = 0; i < total; i++) {
      const ownerResult = ownerResults[i];
      const dataResult = dataResults[i];
      if (ownerResult.status !== "success") continue;

      const owner = (ownerResult.result as string).toLowerCase();
      if (!holderMap.has(owner)) {
        holderMap.set(owner, {
          tokenIds: [],
          receiptCount: 0,
          authenticityCount: 0,
          loyaltyCount: 0,
          loyaltyTier: "None",
        });
      }
      const holder = holderMap.get(owner)!;
      holder.tokenIds.push(i);

      if (dataResult.status === "success") {
        const data = dataResult.result as [number, string, string, number, bigint];
        const nftType = NFT_TYPES[data[0]];
        if (nftType === "Receipt") holder.receiptCount++;
        else if (nftType === "Authenticity") holder.authenticityCount++;
        else if (nftType === "Loyalty") {
          holder.loyaltyCount++;
          holder.loyaltyTier = LOYALTY_TIERS[data[3]] ?? "None";
        }
      }
    }

    const uniqueOwners = Array.from(holderMap.keys());

    // Batch SPH balances
    let sphBalances: Map<string, string> = new Map();
    if (sphAddress && isAddress(sphAddress)) {
      const sphCalls = uniqueOwners.map((addr) => ({
        address: sphAddress as `0x${string}`,
        abi: SOPHO_TOKEN_ABI,
        functionName: "balanceOf" as const,
        args: [addr as `0x${string}`] as const,
      }));
      const sphResults = await client.multicall({ contracts: sphCalls });
      for (let i = 0; i < uniqueOwners.length; i++) {
        const result = sphResults[i];
        if (result.status === "success") {
          const raw = result.result as bigint;
          // SPH has 18 decimals
          const formatted = (Number(raw) / 1e18).toFixed(4);
          sphBalances.set(uniqueOwners[i], formatted);
        } else {
          sphBalances.set(uniqueOwners[i], "0");
        }
      }
    }

    const analytics: NftHolderAnalytics[] = uniqueOwners.map((addr) => {
      const holder = holderMap.get(addr)!;
      return {
        walletAddress: addr,
        totalNfts: holder.tokenIds.length,
        receiptCount: holder.receiptCount,
        authenticityCount: holder.authenticityCount,
        loyaltyCount: holder.loyaltyCount,
        loyaltyTier: holder.loyaltyTier,
        sphBalance: sphBalances.get(addr) ?? "0",
        tokenIds: holder.tokenIds,
      };
    });

    // Sort by total NFTs descending
    analytics.sort((a, b) => b.totalNfts - a.totalNfts);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("NFT analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch NFT analytics" },
      { status: 500 }
    );
  }
}
