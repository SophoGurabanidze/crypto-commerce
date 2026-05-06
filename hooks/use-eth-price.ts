"use client";

import { useState, useEffect } from "react";

export function useEthPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrice() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const data = await res.json();
        if (!cancelled) {
          setPrice(data.ethereum.usd);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPrice();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrice, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const usdToEth = (usdAmount: number): number | null => {
    if (!price) return null;
    return usdAmount / price;
  };

  return { ethPrice: price, loading, usdToEth };
}
