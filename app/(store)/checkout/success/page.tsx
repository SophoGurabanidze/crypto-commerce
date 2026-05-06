"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, ImageIcon, ExternalLink, Wallet } from "lucide-react";
import { useEffect, useState, useRef } from "react";

type NftStatus = "idle" | "minting" | "minted" | "error" | "no-wallet" | "not-needed";
type MintedAuthenticity = {
  productId: string;
  productName: string;
  tokenId: string | null;
  transactionHash: string | null;
};
type LoyaltyResult = {
  tokenId: string | null;
  transactionHash: string | null;
  tier: number;
  tierName: string;
  upgraded?: boolean;
};
const TIER_LABELS = ["None", "Bronze", "Silver", "Gold"] as const;

const nftContractAddress = process.env.NEXT_PUBLIC_SOPHO_NFT_ADDRESS;
const EXPLORER_TX_BASE = "https://sepolia.etherscan.io/tx/";

function promptAddToMetaMask(tokenId: string) {
  if (!nftContractAddress || typeof window === "undefined" || !window.ethereum) return;
  window.ethereum.request({
    method: "wallet_watchAsset",
    params: {
      type: "ERC721",
      options: {
        address: nftContractAddress,
        tokenId,
      },
    },
  }).catch(() => {
    // User dismissed or wallet doesn't support ERC721 watchAsset
  });
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") as Id<"orders"> | null;
  const walletAddress = searchParams.get("wallet");
  const order = useQuery(
    api.orders.getById,
    orderId ? { id: orderId } : "skip"
  );
  const paidOrderCount = useQuery(
    api.orders.countPaidByUser,
    order ? {} : "skip"
  );

  const [receiptStatus, setReceiptStatus] = useState<NftStatus>("idle");
  const [receiptTxHash, setReceiptTxHash] = useState<string | null>(null);
  const [receiptTokenId, setReceiptTokenId] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<NftStatus>("idle");
  const [authMints, setAuthMints] = useState<MintedAuthenticity[]>([]);
  const [loyaltyStatus, setLoyaltyStatus] = useState<NftStatus>("idle");
  const [loyaltyResult, setLoyaltyResult] = useState<LoyaltyResult | null>(null);
  const [currentTier, setCurrentTier] = useState<number | null>(null);
  const mintAttempted = useRef(false);

  const targetTier =
    paidOrderCount === undefined
      ? 0
      : paidOrderCount >= 15
        ? 3
        : paidOrderCount >= 7
          ? 2
          : paidOrderCount >= 3
            ? 1
            : 0;

  useEffect(() => {
    if (!walletAddress) return;
    fetch(`/api/loyalty-tier?address=${walletAddress}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.tier === "number") setCurrentTier(data.tier);
      })
      .catch(() => {
        // Keep nullable state if tier fetch fails
      });
  }, [walletAddress]);

  useEffect(() => {
    if (!order || !orderId || mintAttempted.current) return;
    if (!walletAddress) return;

    if (order.status !== "paid" && order.status !== "delivered") return;
    if (paidOrderCount === undefined) return;

    const authEligibleItems = Array.from(
      new Map(
        order.items
          .filter((item) => item.hasAuthCertificate)
          .map((item) => [String(item.productId), item])
      ).values()
    );
    const nextTier = targetTier;

    mintAttempted.current = true;

    (async () => {
      setReceiptStatus("minting");
      setAuthStatus(authEligibleItems.length > 0 ? "minting" : "not-needed");
      setLoyaltyStatus(nextTier > 0 ? "minting" : "not-needed");
      try {
        const receiptRes = await fetch("/api/mint-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            buyerAddress: walletAddress,
            orderDetails: {
              total: order.total,
              items: order.items.length,
            },
          }),
        });
        const receiptData = await receiptRes.json();

        if (!receiptData.success) {
          setReceiptStatus("error");
          setAuthStatus("error");
          setLoyaltyStatus("error");
          return;
        }

        setReceiptStatus("minted");
        setReceiptTxHash(receiptData.transactionHash ?? null);
        if (receiptData.tokenId) {
          setReceiptTokenId(receiptData.tokenId);
          promptAddToMetaMask(receiptData.tokenId);
        }

        if (authEligibleItems.length > 0) {
          const mintedAuth: MintedAuthenticity[] = [];
          for (const item of authEligibleItems) {
            const authRes = await fetch("/api/mint-authenticity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: item.productId,
                productName: item.productName,
                buyerAddress: walletAddress,
              }),
            });
            const authData = await authRes.json();
            if (!authData.success) {
              setAuthStatus("error");
              continue;
            }
            mintedAuth.push({
              productId: String(item.productId),
              productName: item.productName,
              tokenId: authData.tokenId ?? null,
              transactionHash: authData.transactionHash ?? null,
            });
          }
          setAuthMints(mintedAuth);
          if (mintedAuth.length > 0) setAuthStatus("minted");
        }

        if (nextTier > 0 && paidOrderCount !== undefined) {
          const loyaltyRes = await fetch("/api/mint-loyalty", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buyerAddress: walletAddress,
              tier: nextTier,
              orderCount: paidOrderCount,
            }),
          });
          const loyaltyData = await loyaltyRes.json();
          if (!loyaltyData.success) {
            setLoyaltyStatus("error");
          } else if (loyaltyData.skipped) {
            setLoyaltyStatus("not-needed");
          } else {
            setLoyaltyStatus("minted");
            setLoyaltyResult({
              tokenId: loyaltyData.tokenId ?? null,
              transactionHash: loyaltyData.transactionHash ?? null,
              tier: loyaltyData.tier,
              tierName: loyaltyData.tierName ?? "Bronze",
              upgraded: loyaltyData.upgraded,
            });
          }
        }
      } catch {
        setReceiptStatus("error");
        if (authEligibleItems.length > 0) setAuthStatus("error");
        if (nextTier > 0) setLoyaltyStatus("error");
      }
    })();
  }, [order, orderId, walletAddress, paidOrderCount, targetTier]);

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Invalid order</h1>
        <Link href="/" className="mt-4 inline-block">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  if (order === undefined) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg space-y-6">
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />

          <div>
            <h1 className="text-2xl font-bold">Order Confirmed!</h1>
            <p className="text-muted-foreground mt-2">
              Thank you for your purchase.
            </p>
          </div>

          {order && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-medium">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                  ${(order.total / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge>{order.status}</Badge>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center pt-4">
            <Link href="/orders">
              <Button>View Orders</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Receipt NFT Card */}
      {walletAddress && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">Purchase Receipt NFT</h3>
            </div>

            {receiptStatus === "minting" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Minting your receipt NFT...
              </div>
            )}

            {receiptStatus === "minted" && (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-medium">
                  Receipt NFT minted to your wallet!
                </p>
                {receiptTxHash && (
                  <a
                    href={`${EXPLORER_TX_BASE}${receiptTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {receiptTokenId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => promptAddToMetaMask(receiptTokenId)}
                  >
                    <Wallet className="h-3 w-3" />
                    Add to MetaMask
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  This NFT is your immutable proof of purchase. It lives in your
                  wallet forever.
                </p>
                <Link href="/nfts" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  View all your NFTs →
                </Link>
              </div>
            )}

            {receiptStatus === "error" && (
              <p className="text-sm text-red-500">
                Failed to mint receipt NFT. Your order is still confirmed.
              </p>
            )}

            {receiptStatus === "idle" && (
              <p className="text-sm text-muted-foreground">
                Preparing receipt NFT...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {walletAddress && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold">Authenticity Certificate NFTs</h3>
            </div>
            {authStatus === "minting" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Minting authenticity certificates...
              </div>
            )}
            {authStatus === "not-needed" && (
              <p className="text-sm text-muted-foreground">
                No products in this order require authenticity certificates.
              </p>
            )}
            {authStatus === "minted" && (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-medium">
                  Authenticity certificates minted for eligible items.
                </p>
                {authMints.map((mint) => (
                  <div key={mint.productId} className="text-xs text-muted-foreground">
                    {mint.productName}
                    {mint.transactionHash ? (
                      <a
                        href={`${EXPLORER_TX_BASE}${mint.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 hover:text-foreground"
                      >
                        view tx
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            {authStatus === "error" && (
              <p className="text-sm text-red-500">
                Failed to mint one or more authenticity certificates.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {walletAddress && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold">Loyalty Membership NFT</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Current tier:{" "}
              {currentTier === null ? "Loading..." : TIER_LABELS[currentTier] ?? "None"}
              {"  ->  "}
              Target after this order: {TIER_LABELS[targetTier] ?? "None"}
            </p>
            {loyaltyStatus === "minting" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking loyalty tier and minting if eligible...
              </div>
            )}
            {loyaltyStatus === "not-needed" && (
              <p className="text-sm text-muted-foreground">
                No loyalty tier update for this order yet.
              </p>
            )}
            {loyaltyStatus === "minted" && loyaltyResult && (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-medium">
                  {loyaltyResult.upgraded ? "Upgraded to" : "Minted"} {loyaltyResult.tierName} Loyalty NFT.
                </p>
                {loyaltyResult.transactionHash && (
                  <a
                    href={`${EXPLORER_TX_BASE}${loyaltyResult.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
            {loyaltyStatus === "error" && (
              <p className="text-sm text-red-500">
                Failed to mint loyalty NFT.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
