"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DirectTransfer } from "./direct-transfer";
import { EscrowPayment } from "./escrow-payment";
import { StablecoinPayment } from "./stablecoin-payment";
import { Wallet, Shield, DollarSign } from "lucide-react";

type CryptoMethod = "direct" | "escrow" | "stablecoin";

interface CryptoPaymentPanelProps {
  orderId: Id<"orders">;
  amountUsd: number; // in cents
}

const methods = [
  {
    key: "direct" as const,
    label: "ETH Direct",
    icon: Wallet,
    desc: "Simple ETH transfer",
  },
  {
    key: "escrow" as const,
    label: "Escrow",
    icon: Shield,
    desc: "Buyer-protected",
  },
  {
    key: "stablecoin" as const,
    label: "Stablecoin",
    icon: DollarSign,
    desc: "SPH / USDC / USDT",
  },
];

export function CryptoPaymentPanel({
  orderId,
  amountUsd,
}: CryptoPaymentPanelProps) {
  const { isConnected } = useAccount();
  const [method, setMethod] = useState<CryptoMethod>("direct");

  return (
    <div className="space-y-6">
      {/* Connect Wallet */}
      <div className="flex justify-center">
        <ConnectButton />
      </div>

      {!isConnected ? (
        <p className="text-center text-muted-foreground">
          Connect your wallet to continue with crypto payment.
        </p>
      ) : (
        <>
          {/* Method selector */}
          <div className="grid grid-cols-3 gap-3">
            {methods.map((m) => (
              <Button
                key={m.key}
                variant="outline"
                className={cn(
                  "h-auto flex flex-col items-center gap-1 py-3",
                  method === m.key && "border-primary ring-1 ring-primary"
                )}
                onClick={() => setMethod(m.key)}
              >
                <m.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{m.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {m.desc}
                </span>
              </Button>
            ))}
          </div>

          <Separator />

          {/* Payment form */}
          <Card>
            <CardContent className="p-6">
              {method === "direct" && (
                <DirectTransfer orderId={orderId} amountUsd={amountUsd} />
              )}
              {method === "escrow" && (
                <EscrowPayment orderId={orderId} amountUsd={amountUsd} />
              )}
              {method === "stablecoin" && (
                <StablecoinPayment orderId={orderId} amountUsd={amountUsd} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
