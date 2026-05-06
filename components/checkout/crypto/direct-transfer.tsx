"use client";

import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEthPrice } from "@/hooks/use-eth-price";
import { Button } from "@/components/ui/button";
import { TransactionStatus } from "./transaction-status";
import { STORE_WALLET } from "@/lib/web3/tokens";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface DirectTransferProps {
  orderId: Id<"orders">;
  amountUsd: number; // in cents
}

export function DirectTransfer({ orderId, amountUsd }: DirectTransferProps) {
  const router = useRouter();
  const { address } = useAccount();
  const { ethPrice, usdToEth, loading: priceLoading } = useEthPrice();
  const markPaid = useMutation(api.orders.markPaid);

  const amountInDollars = amountUsd / 100;
  const ethAmount = usdToEth(amountInDollars);

  const {
    sendTransaction,
    data: hash,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  // When confirmed, mark order as paid
  useEffect(() => {
    if (isSuccess && hash) {
      markPaid({
        id: orderId,
        paymentDetails: {
          transactionHash: hash,
          walletAddress: STORE_WALLET,
          tokenSymbol: "ETH",
          amountInToken: ethAmount?.toFixed(18),
          ethPriceAtPurchase: ethPrice ?? undefined,
        },
      }).then(() => {
        router.push(`/checkout/success?orderId=${orderId}&wallet=${address}`);
      });
    }
  }, [isSuccess, hash]);

  const handlePay = () => {
    if (!ethAmount) return;
    sendTransaction({
      to: STORE_WALLET,
      value: parseEther(ethAmount.toFixed(18)),
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Direct ETH Transfer</h4>
      <p className="text-sm text-muted-foreground">
        Send ETH directly to our wallet. Simplest option.
      </p>

      {priceLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching ETH price...
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-muted space-y-1">
          <div className="flex justify-between text-sm">
            <span>Amount</span>
            <span>${amountInDollars.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>ETH Price</span>
            <span>${ethPrice?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>You Pay</span>
            <span>{ethAmount?.toFixed(6)} ETH</span>
          </div>
        </div>
      )}

      <TransactionStatus
        hash={hash}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={sendError?.message || confirmError?.message}
      />

      <Button
        className="w-full"
        onClick={handlePay}
        disabled={!ethAmount || isSending || isConfirming || isSuccess}
      >
        {isSending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirm in Wallet...
          </>
        ) : isConfirming ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirming...
          </>
        ) : (
          `Send ${ethAmount?.toFixed(6) ?? "..."} ETH`
        )}
      </Button>
    </div>
  );
}
