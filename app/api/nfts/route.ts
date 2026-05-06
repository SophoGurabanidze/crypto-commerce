import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, isAddress } from "viem";
import { sepolia } from "viem/chains";
import { SOPHO_NFT_ABI } from "@/lib/web3/contracts";

const NFT_TYPES = ["Receipt", "Authenticity", "Loyalty"] as const;
const LOYALTY_TIERS = ["None", "Bronze", "Silver", "Gold"] as const;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "Missing or invalid address parameter" },
      { status: 400 }
    );
  }

  const nftAddress = process.env.NEXT_PUBLIC_SOPHO_NFT_ADDRESS;
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

  if (!nftAddress || !rpcUrl) {
    return NextResponse.json(
      { error: "Server not configured for NFT reading" },
      { status: 500 }
    );
  }

  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const contractParams = {
    address: nftAddress as `0x${string}`,
    abi: SOPHO_NFT_ABI,
  } as const;

  try {
    const totalMinted = await client.readContract({
      ...contractParams,
      functionName: "totalMinted",
    });

    const total = Number(totalMinted);
    if (total === 0) {
      return NextResponse.json([]);
    }

    // Batch ownerOf calls using multicall
    const ownerCalls = Array.from({ length: total }, (_, i) => ({
      ...contractParams,
      functionName: "ownerOf" as const,
      args: [BigInt(i)] as const,
    }));

    const ownerResults = await client.multicall({ contracts: ownerCalls });

    // Find tokens owned by this address
    const ownedTokenIds: number[] = [];
    for (let i = 0; i < ownerResults.length; i++) {
      const result = ownerResults[i];
      if (
        result.status === "success" &&
        (result.result as string).toLowerCase() === address.toLowerCase()
      ) {
        ownedTokenIds.push(i);
      }
    }

    if (ownedTokenIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch nftData and tokenURI for owned tokens
    const dataCalls = ownedTokenIds.flatMap((id) => [
      {
        ...contractParams,
        functionName: "nftData" as const,
        args: [BigInt(id)] as const,
      },
      {
        ...contractParams,
        functionName: "tokenURI" as const,
        args: [BigInt(id)] as const,
      },
    ]);

    const dataResults = await client.multicall({ contracts: dataCalls });

    const nfts = ownedTokenIds.map((tokenId, index) => {
      const dataResult = dataResults[index * 2];
      const uriResult = dataResults[index * 2 + 1];

      let metadata: Record<string, unknown> = {};
      if (uriResult.status === "success") {
        const uri = uriResult.result as string;
        if (uri.startsWith("data:application/json;base64,")) {
          try {
            const json = Buffer.from(
              uri.replace("data:application/json;base64,", ""),
              "base64"
            ).toString("utf-8");
            metadata = JSON.parse(json);
          } catch {
            // Invalid metadata, leave empty
          }
        }
      }

      let nftType = "Unknown";
      let orderId = "";
      let productId = "";
      let loyaltyTier = "None";
      let mintedAt = 0;

      if (dataResult.status === "success") {
        const data = dataResult.result as [number, string, string, number, bigint];
        nftType = NFT_TYPES[data[0]] ?? "Unknown";
        orderId = data[1];
        productId = data[2];
        loyaltyTier = LOYALTY_TIERS[data[3]] ?? "None";
        mintedAt = Number(data[4]);
      }

      return {
        tokenId,
        nftType,
        orderId,
        productId,
        loyaltyTier,
        mintedAt,
        name: (metadata.name as string) || `Sopho NFT #${tokenId}`,
        description: (metadata.description as string) || "",
        image: (metadata.image as string) || "",
        attributes: (metadata.attributes as Array<{ trait_type: string; value: string }>) || [],
      };
    });

    return NextResponse.json(nfts);
  } catch (error) {
    console.error("NFT fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch NFTs" },
      { status: 500 }
    );
  }
}
