"use client";

import { useQuery } from "convex/react";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { fetchNftAnalytics, nftKeys } from "@/lib/query/nfts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, ImageIcon, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIER_COLORS: Record<string, string> = {
  Gold: "bg-yellow-100 text-yellow-800",
  Silver: "bg-gray-100 text-gray-700",
  Bronze: "bg-orange-100 text-orange-800",
  None: "bg-muted text-muted-foreground",
};

const TYPE_BADGE: Record<string, string> = {
  Receipt: "bg-blue-100 text-blue-800",
  Authenticity: "bg-purple-100 text-purple-800",
  Loyalty: "bg-green-100 text-green-800",
};

export default function NftAnalyticsPage() {
  const walletUsers = useQuery(api.analytics.getWalletUsers);
  const {
    data: holders,
    isLoading: loading,
    error: queryError,
    refetch,
    isFetching,
  } = useTanstackQuery({
    queryKey: nftKeys.analytics,
    queryFn: fetchNftAnalytics,
  });
  const error = queryError instanceof Error ? queryError.message : null;

  // Build a lookup: walletAddress (lowercase) -> user info
  const userByWallet = new Map<string, { name: string; email: string }>();
  if (walletUsers) {
    for (const u of walletUsers) {
      userByWallet.set(u.walletAddress.toLowerCase(), {
        name: u.name,
        email: u.email,
      });
    }
  }

  const totalNfts = holders?.reduce((s, h) => s + h.totalNfts, 0) ?? 0;
  const totalSph = holders
    ? holders.reduce((s, h) => s + parseFloat(h.sphBalance), 0).toFixed(4)
    : "0";
  const totalHolders = holders?.length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">NFT Analytics</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">NFT Holders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : totalHolders}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total NFTs Minted</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : totalNfts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total SPH Held (Holders)</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : totalSph}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holders Table */}
      <Card>
        <CardHeader>
          <CardTitle>NFT Holders</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive mb-4">Error: {error}</p>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading on-chain data...
            </p>
          ) : !holders || holders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No NFT holders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">#</th>
                    <th className="text-left py-2 pr-4">Wallet</th>
                    <th className="text-left py-2 pr-4">User</th>
                    <th className="text-center py-2 pr-4">Total NFTs</th>
                    <th className="text-center py-2 pr-4">Receipts</th>
                    <th className="text-center py-2 pr-4">Authenticity</th>
                    <th className="text-center py-2 pr-4">Loyalty</th>
                    <th className="text-center py-2 pr-4">Loyalty Tier</th>
                    <th className="text-right py-2">SPH Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {holders.map((holder, idx) => {
                    const user = userByWallet.get(holder.walletAddress);
                    return (
                      <tr key={holder.walletAddress} className="border-b last:border-0">
                        <td className="py-2 pr-4 text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="font-mono text-xs">
                            {holder.walletAddress.slice(0, 6)}…
                            {holder.walletAddress.slice(-4)}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {user ? (
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Not linked
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-center font-bold">
                          {holder.totalNfts}
                        </td>
                        <td className="py-2 pr-4 text-center">
                          {holder.receiptCount > 0 ? (
                            <Badge
                              className={`text-xs ${TYPE_BADGE["Receipt"]}`}
                              variant="secondary"
                            >
                              {holder.receiptCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-center">
                          {holder.authenticityCount > 0 ? (
                            <Badge
                              className={`text-xs ${TYPE_BADGE["Authenticity"]}`}
                              variant="secondary"
                            >
                              {holder.authenticityCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-center">
                          {holder.loyaltyCount > 0 ? (
                            <Badge
                              className={`text-xs ${TYPE_BADGE["Loyalty"]}`}
                              variant="secondary"
                            >
                              {holder.loyaltyCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-center">
                          {holder.loyaltyTier !== "None" ? (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                TIER_COLORS[holder.loyaltyTier] ?? ""
                              }`}
                            >
                              {holder.loyaltyTier}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2 text-right font-mono text-xs">
                          {parseFloat(holder.sphBalance) > 0
                            ? `${parseFloat(holder.sphBalance).toLocaleString()} SPH`
                            : <span className="text-muted-foreground">0 SPH</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NFT Type Breakdown */}
      {holders && holders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              { key: "receiptCount", label: "Receipt NFTs", badge: "Receipt" },
              { key: "authenticityCount", label: "Authenticity NFTs", badge: "Authenticity" },
              { key: "loyaltyCount", label: "Loyalty NFTs", badge: "Loyalty" },
            ] as const
          ).map(({ key, label, badge }) => {
            const total = holders.reduce((s, h) => s + h[key], 0);
            const topHolders = [...holders]
              .filter((h) => h[key] > 0)
              .sort((a, b) => b[key] - a[key])
              .slice(0, 5);
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[badge]}`}
                    >
                      {badge}
                    </span>
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-3">{total} total</div>
                  <div className="space-y-1">
                    {topHolders.map((h) => {
                      const user = userByWallet.get(h.walletAddress);
                      return (
                        <div
                          key={h.walletAddress}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="font-mono text-muted-foreground">
                            {user?.name ||
                              `${h.walletAddress.slice(0, 6)}…${h.walletAddress.slice(-4)}`}
                          </span>
                          <span className="font-medium">{h[key]}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
