"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import type { WalletName } from "@solana/wallet-adapter-base";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  SPH2_MINT,
  STORE_SOLANA_WALLET,
  SPH2_DECIMALS,
  SPH2_PER_USD,
} from "@/lib/solana/config";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Sph2PaymentProps {
  amountUsd: number; // in cents
}

export function Sph2Payment({ amountUsd }: Sph2PaymentProps) {
  const { publicKey, sendTransaction, connected, disconnect, select, connect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amountDollars = amountUsd / 100;
  const sph2Amount = Math.ceil(amountDollars * SPH2_PER_USD);
  const sph2AmountRaw = BigInt(sph2Amount) * BigInt(10 ** SPH2_DECIMALS);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    const fetchBalance = async () => {
      try {
        const mint = new PublicKey(SPH2_MINT);
        const ata = await getAssociatedTokenAddress(mint, publicKey);
        const info = await connection.getTokenAccountBalance(ata);
        setBalance(Number(info.value.uiAmount));
      } catch {
        setBalance(0);
      }
    };
    fetchBalance();
  }, [publicKey, connection]);

  const handlePay = async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const mint = new PublicKey(SPH2_MINT);
      const storeWallet = new PublicKey(STORE_SOLANA_WALLET);
      const fromAta = await getAssociatedTokenAddress(mint, publicKey);
      const toAta = await getAssociatedTokenAddress(mint, storeWallet);

      const transaction = new Transaction();

      // Create store's token account if it doesn't exist
      const toAtaInfo = await connection.getAccountInfo(toAta);
      if (!toAtaInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            toAta,
            storeWallet,
            mint
          )
        );
      }

      transaction.add(
        createTransferInstruction(
          fromAta,
          toAta,
          publicKey,
          sph2AmountRaw,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const sig = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setTxSig(sig);
      // Refresh balance
      const info = await connection.getTokenAccountBalance(fromAta);
      setBalance(Number(info.value.uiAmount));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  if (txSig) {
    return (
      <div className="text-center space-y-3 py-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <p className="font-semibold text-green-600">Payment successful!</p>
        <p className="text-xs text-muted-foreground">
          {sph2Amount.toLocaleString()} SPH2 sent
        </p>
        <a
          href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 underline break-all"
        >
          View on Solana Explorer
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!connected ? (
        <Button
          className="w-full"
          onClick={() => {
            select("Phantom" as WalletName);
            connect().catch(() => {});
          }}
        >
          Connect Phantom
        </Button>
      ) : (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-mono">
            {publicKey!.toBase58().slice(0, 4)}...{publicKey!.toBase58().slice(-4)}
          </span>
          <button onClick={() => disconnect()} className="text-xs text-red-500 underline">
            Disconnect
          </button>
        </div>
      )}

      {connected && publicKey && (
        <>
          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your SPH2 balance</span>
              <span>
                {balance !== null
                  ? `${balance.toLocaleString()} SPH2`
                  : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Amount due</span>
              <span>{sph2Amount.toLocaleString()} SPH2</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rate: 100 SPH2 = $1.00</span>
              <span>${amountDollars.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            onClick={handlePay}
            disabled={loading || balance === null || balance < sph2Amount}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            {loading
              ? "Processing..."
              : `Pay ${sph2Amount.toLocaleString()} SPH2`}
          </button>

          {balance !== null && balance < sph2Amount && (
            <p className="text-sm text-red-500 text-center">
              Insufficient SPH2 balance (need {sph2Amount.toLocaleString()},
              have {balance.toLocaleString()})
            </p>
          )}
        </>
      )}
    </div>
  );
}
