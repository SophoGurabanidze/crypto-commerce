"use client";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { TransactionStatus } from "./transaction-status";
import { TOKENS, STORE_WALLET } from "@/lib/web3/tokens";
import { USDT_ABI, SOPHO_TOKEN_ABI } from "@/lib/web3/contracts";
import { Loader2, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface StablecoinPaymentProps {
  orderId: Id<"orders">;
  amountUsd: number; // in cents
}

export function StablecoinPayment({
  orderId,
  amountUsd,
}: StablecoinPaymentProps) {
  const router = useRouter();
  const { address } = useAccount();
  const markPaid = useMutation(api.orders.markPaid);
  const [selectedToken, setSelectedToken] = useState<"USDC" | "USDT" | "SPH">("USDC");

  const amountInDollars = amountUsd / 100;
  const tokenConfig = TOKENS[selectedToken];
  const amount = parseUnits(amountInDollars.toString(), tokenConfig.decimals);

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
          walletAddress: STORE_WALLET,
          tokenSymbol: selectedToken,
          amountInToken: amountInDollars.toString(),
        },
      }).then(() => {
        router.push(`/checkout/success?orderId=${orderId}&wallet=${address}`);
      });
    }
  }, [isSuccess, hash]);

  const handlePay = () => {
    // Each token may need a different ABI:
    // - USDT has non-standard ABI (no boolean return)
    // - SPH uses our custom SophoToken ABI
    // - USDC uses standard ERC-20 ABI
    const abi =
      selectedToken === "USDT"
        ? USDT_ABI
        : selectedToken === "SPH"
          ? SOPHO_TOKEN_ABI
          : erc20Abi;

    writeContract({
      address: tokenConfig.address,
      abi,
      functionName: "transfer",
      args: [STORE_WALLET, amount],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-blue-600" />
        <h4 className="font-medium">Stablecoin Payment</h4>
      </div>
      <p className="text-sm text-muted-foreground">
        Pay with stablecoins. No price volatility — 1 token = $1.
      </p>

      {/* Token selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedToken === "SPH" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedToken("SPH")}
        >
          SPH
        </Button>
        <Button
          variant={selectedToken === "USDC" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedToken("USDC")}
        >
          USDC
        </Button>
        <Button
          variant={selectedToken === "USDT" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedToken("USDT")}
        >
          USDT
        </Button>
      </div>

      <div className="p-4 rounded-lg bg-muted space-y-1">
        <div className="flex justify-between text-sm">
          <span>Amount</span>
          <span>${amountInDollars.toFixed(2)} USD</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>You Pay</span>
          <span>
            {amountInDollars.toFixed(2)} {selectedToken}
          </span>
        </div>
      </div>

      <TransactionStatus
        hash={hash}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={writeError?.message || confirmError?.message}
      />

      <Button
        className="w-full"
        onClick={handlePay}
        disabled={isSending || isConfirming || isSuccess}
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
          `Send ${amountInDollars.toFixed(2)} ${selectedToken}`
        )}
      </Button>
    </div>
  );
}
