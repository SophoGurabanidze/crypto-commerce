"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface TransactionStatusProps {
  hash?: string;
  isConfirming: boolean;
  isSuccess: boolean;
  error?: string;
}

export function TransactionStatus({
  hash,
  isConfirming,
  isSuccess,
  error,
}: TransactionStatusProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="text-sm">Transaction failed: {error}</span>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">Transaction confirmed!</p>
          {hash && (
            <p className="text-xs mt-1 font-mono break-all">{hash}</p>
          )}
        </div>
      </div>
    );
  }

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <div>
          <p className="text-sm font-medium">Waiting for confirmation...</p>
          {hash && (
            <p className="text-xs mt-1 font-mono break-all">{hash}</p>
          )}
        </div>
      </div>
    );
  }

  if (hash) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm">Transaction submitted</p>
          <p className="text-xs mt-1 font-mono break-all text-muted-foreground">
            {hash}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
