"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ImageIcon, Wallet, Plus } from "lucide-react";

interface NFT {
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
}

const TYPE_COLORS: Record<string, string> = {
  Receipt: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Authenticity: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Loyalty: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const nftContractAddress = process.env.NEXT_PUBLIC_SOPHO_NFT_ADDRESS;

export function NftGallery() {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNfts = useCallback(async (walletAddress: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/nfts?address=${walletAddress}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNfts(data);
      } else {
        setError(data.error || "Failed to load NFTs");
      }
    } catch {
      setError("Failed to load NFTs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!address) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNfts(address);
  }, [address, loadNfts]);

  const addToMetaMask = useCallback(async (tokenId: number) => {
    if (!nftContractAddress || typeof window === "undefined" || !window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC721",
          options: {
            address: nftContractAddress,
            tokenId: String(tokenId),
          },
        },
      });
    } catch {
      // User dismissed or wallet doesn't support ERC721 watchAsset
    }
  }, []);

  const addAllToMetaMask = useCallback(async () => {
    for (const nft of nfts) {
      await addToMetaMask(nft.tokenId);
    }
  }, [nfts, addToMetaMask]);

  if (!isConnected) {
    return (
      <div className="text-center py-16 space-y-4">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your wallet to view your NFT collection.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">No NFTs Yet</h2>
        <p className="text-muted-foreground">
          Make a crypto purchase to receive your first receipt NFT!
        </p>
      </div>
    );
  }

  const hasMetaMask = typeof window !== "undefined" && !!window.ethereum;

  return (
    <div className="space-y-4">
      {hasMetaMask && nftContractAddress && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="gap-1" onClick={addAllToMetaMask}>
            <Wallet className="h-4 w-4" />
            Import All to MetaMask
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <Card key={nft.tokenId} className="overflow-hidden">
            <div className="aspect-square bg-muted relative">
              {nft.image ? (
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
              <Badge
                className={`absolute top-2 right-2 ${TYPE_COLORS[nft.nftType] || ""}`}
              >
                {nft.nftType}
              </Badge>
            </div>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold truncate">{nft.name}</h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Token #{nft.tokenId}</span>
                {nft.mintedAt > 0 && (
                  <span>
                    {new Date(nft.mintedAt * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
              {nft.loyaltyTier !== "None" && (
                <Badge variant="outline" className="text-xs">
                  {nft.loyaltyTier} Tier
                </Badge>
              )}
              <div className="flex items-center gap-2">
                {nftContractAddress && (
                  <a
                    href={`https://sepolia.etherscan.io/nft/${nftContractAddress}/${nft.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {hasMetaMask && nftContractAddress && (
                  <button
                    onClick={() => addToMetaMask(nft.tokenId)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                    MetaMask
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
