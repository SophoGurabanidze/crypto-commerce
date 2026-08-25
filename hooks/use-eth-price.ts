"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEthUsdPrice, nftKeys } from "@/lib/query/nfts";

export function useEthPrice() {
  const { data: price = null, isLoading: loading } = useQuery({
    queryKey: nftKeys.ethPrice,
    queryFn: fetchEthUsdPrice,
    refetchInterval: 30_000,
  });

  const usdToEth = (usdAmount: number): number | null => {
    if (!price) return null;
    return usdAmount / price;
  };

  return { ethPrice: price, loading, usdToEth };
}
