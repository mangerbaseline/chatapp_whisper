"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  redeemTokens,
  fetchBalance,
} from "@/redux/features/wallet/walletSlice";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { toast } from "sonner";
import { Coins, ArrowRightLeft, Info, Landmark } from "lucide-react";

const TOKEN_RATE_USD = 0.05;
const REDEMPTION_FEE_PERCENT = 0.1;

export default function RedeemForm() {
  const dispatch = useAppDispatch();
  const { balance, isLoading } = useAppSelector((state) => state.wallet);
  const { user } = useAppSelector((state) => state.auth);

  const [amountTokens, setAmountTokens] = useState<string>("");
  const [calculation, setCalculation] = useState({
    gross: 0,
    fee: 0,
    net: 0,
  });

  useEffect(() => {
    const tokens = parseInt(amountTokens) || 0;
    const gross = tokens * TOKEN_RATE_USD;
    const fee = gross * REDEMPTION_FEE_PERCENT;
    const net = gross - fee;
    setCalculation({ gross, fee, net });
  }, [amountTokens]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokens = parseInt(amountTokens);

    if (!tokens || tokens <= 0) {
      toast.error("Please enter a valid amount of tokens.");
      return;
    }

    if (tokens > balance) {
      toast.error("Insufficient token balance.");
      return;
    }

    try {
      await dispatch(redeemTokens({ amountTokens: tokens })).unwrap();
      setAmountTokens("");
      dispatch(fetchBalance());
    } catch (err: any) {
      toast.error(err?.message || "Redemption failed.");
    }
  };

  if (user?.bankAccountStatus !== "verified") {
    return (
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Landmark className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-muted-foreground">
              Account Not Verified
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              You need a verified bank account to redeem tokens. Please connect
              your bank account in the Settings &gt; Payments tab.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-primary/50" />
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          <CardTitle>Redeem Tokens</CardTitle>
        </div>
        <CardDescription>
          Convert your tokens into USD and withdraw to your bank account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="tokens">Amount of Tokens</Label>
            <span className="text-xs text-muted-foreground">
              Balance: {balance.toLocaleString()} tokens
            </span>
          </div>
          <div className="relative">
            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="tokens"
              type="number"
              placeholder="0"
              className="pl-9"
              value={amountTokens}
              onChange={(e) => setAmountTokens(e.target.value)}
              min="1"
              max={balance}
            />
          </div>
        </div>

        {calculation.gross > 0 && (
          <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rate:</span>
              <span className="font-medium">1 Token = ${TOKEN_RATE_USD}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gross Amount:</span>
              <span className="font-medium">
                ${calculation.gross.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee (10%):</span>
              <span className="font-medium text-destructive">
                - ${calculation.fee.toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-primary/10 flex justify-between items-center text-lg font-bold">
              <span>You Receive:</span>
              <span className="text-primary">
                ${calculation.net.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-start p-3 rounded-lg bg-muted text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <p>
            Redemptions are processed via Stripe Connect. Funds typically reach
            your bank account within 3-7 business days after approval.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full cursor-pointer"
          onClick={handleRedeem}
          disabled={isLoading || !amountTokens || calculation.net <= 0}
        >
          {isLoading ? "Processing..." : "Redeem Now"}
        </Button>
      </CardFooter>
    </Card>
  );
}
