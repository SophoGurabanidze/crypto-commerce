"use client";

import { Web3Provider } from "@/components/providers/web3-provider";
import { NftGallery } from "@/components/nfts/nft-gallery";

export default function NftsPage() {
  return (
    <Web3Provider>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My NFTs</h1>
          <p className="text-muted-foreground mt-1">
            View all NFTs in your connected wallet.
          </p>
        </div>
        <NftGallery />
      </div>
    </Web3Provider>
  );
}
