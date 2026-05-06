"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreditCard, Wallet } from "lucide-react";

export type PaymentMethod = "stripe" | "crypto";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  selected,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Payment Method</h3>
      <div className="grid grid-cols-2 gap-4">
        <Card
          className={cn(
            "cursor-pointer transition-colors",
            selected === "stripe" && "border-primary ring-1 ring-primary"
          )}
          onClick={() => onChange("stripe")}
        >
          <CardContent className="flex flex-col items-center gap-2 p-4">
            <CreditCard className="h-8 w-8" />
            <span className="font-medium">Card (Stripe)</span>
            <span className="text-xs text-muted-foreground text-center">
              Credit/Debit Cards
            </span>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-colors",
            selected === "crypto" && "border-primary ring-1 ring-primary"
          )}
          onClick={() => onChange("crypto")}
        >
          <CardContent className="flex flex-col items-center gap-2 p-4">
            <Wallet className="h-8 w-8" />
            <span className="font-medium">Crypto</span>
            <span className="text-xs text-muted-foreground text-center">
              ETH, USDC, Escrow
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
