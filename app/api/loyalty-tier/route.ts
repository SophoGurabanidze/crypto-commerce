import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, isAddress } from "viem";
import { sepolia } from "viem/chains";
import { SOPHO_NFT_ABI } from "@/lib/web3/contracts";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const nftAddress = process.env.NEXT_PUBLIC_SOPHO_NFT_ADDRESS;
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  if (!nftAddress || !rpcUrl) {
    return NextResponse.json(
      { error: "Server not configured for loyalty reads" },
      { status: 500 }
    );
  }

  try {
    const client = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
    const tier = await client.readContract({
      address: nftAddress as `0x${string}`,
      abi: SOPHO_NFT_ABI,
      functionName: "getLoyaltyTier",
      args: [address],
    });
    return NextResponse.json({ tier: Number(tier) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read tier" },
      { status: 500 }
    );
  }
}
