"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, Circle, Clock } from "lucide-react";

const steps = [
  { key: "pending", label: "Order Placed" },
  { key: "paid", label: "Payment Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const statusOrder: Record<string, number> = {
  pending: 0,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

export function OrderTimeline({ status }: { status: string }) {
  const currentStep = statusOrder[status] ?? -1;

  if (status === "cancelled" || status === "refunded") {
    return (
      <div className="text-center py-4 text-destructive font-medium">
        Order {status === "cancelled" ? "Cancelled" : "Refunded"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step, i) => {
        const isCompleted = i <= currentStep;
        const isCurrent = i === currentStep;

        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={cn(
                "flex-shrink-0",
                isCompleted ? "text-green-600" : "text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle className="h-5 w-5" />
              ) : isCurrent ? (
                <Clock className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                isCompleted ? "font-medium" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
