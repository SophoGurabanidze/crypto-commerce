"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEthPrice } from "@/hooks/use-eth-price";
import { Button } from "@/components/ui/button";
import { TransactionStatus } from "./transaction-status";
import { ESCROW_CONTRACT } from "@/lib/web3/tokens";
import { ESCROW_ABI } from "@/lib/web3/contracts";
import { Loader2, Shield } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface EscrowPaymentProps {
  orderId: Id<"orders">;
  amountUsd: number; // in cents
}

export function EscrowPayment({ orderId, amountUsd }: EscrowPaymentProps) {
  const router = useRouter();
  const { address } = useAccount();
  const { ethPrice, usdToEth, loading: priceLoading } = useEthPrice();
  const markPaid = useMutation(api.orders.markPaid);

  const amountInDollars = amountUsd / 100;
  const ethAmount = usdToEth(amountInDollars);

  const {
    writeContract,
    data: hash,
    isPending: isSending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && hash) {
      markPaid({
        id: orderId,
        paymentDetails: {
          transactionHash: hash,
          escrowContractAddress: ESCROW_CONTRACT,
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
    writeContract({
      address: ESCROW_CONTRACT,
      abi: ESCROW_ABI,
      functionName: "createEscrow",
      args: [orderId],
      value: parseEther(ethAmount.toFixed(18)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-green-600" />
        <h4 className="font-medium">Escrow Payment (Buyer Protected)</h4>
      </div>
      <p className="text-sm text-muted-foreground">
        Funds are held in a smart contract until you confirm delivery. You can
        dispute if there&apos;s an issue.
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
            <span>Escrow Amount</span>
            <span>{ethAmount?.toFixed(6)} ETH</span>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Auto-release after 14 days if no dispute.
          </p>
        </div>
      )}

      <TransactionStatus
        hash={hash}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={writeError?.message || confirmError?.message}
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
          `Fund Escrow (${ethAmount?.toFixed(6) ?? "..."} ETH)`
        )}
      </Button>
    </div>
  );
}
