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

export type WalletNft = {
  tokenId: number;
  nftType: string;
  orderId: string;
  productId: string;
  loyaltyTier: string;
  mintedAt: number;
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
};

export const nftKeys = {
  wallet: (address: string) => ["nfts", address] as const,
  analytics: ["nft-analytics"] as const,
  ethPrice: ["eth-price"] as const,
};

export async function fetchWalletNfts(address: string): Promise<WalletNft[]> {
  const res = await fetch(`/api/nfts?address=${address}`);
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(data.error || "Failed to load NFTs");
  }
  return data;
}

export async function fetchNftAnalytics(): Promise<NftHolderAnalytics[]> {
  const res = await fetch("/api/admin/nft-analytics");
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch");
  }
  return data;
}

export async function fetchEthUsdPrice(): Promise<number> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const data = await res.json();
  const price = data?.ethereum?.usd;
  if (typeof price !== "number") {
    throw new Error("Failed to load ETH price");
  }
  return price;
}
