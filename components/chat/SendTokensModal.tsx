"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  transferTokens,
  fetchBalance,
  clearWalletState,
} from "@/redux/features/wallet/walletSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Coins, Loader2, Send } from "lucide-react";

interface SendTokensModalProps {
  recipientId: string;
  recipientName: string;
  children: React.ReactNode;
}

export default function SendTokensModal({
  recipientId,
  recipientName,
  children,
}: SendTokensModalProps) {
  const dispatch = useAppDispatch();
  const { balance, isLoading } = useAppSelector((state) => state.wallet);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      dispatch(fetchBalance());
    }
  };

  const handleSend = async () => {
    const tokenAmount = parseInt(amount);
    if (!tokenAmount || tokenAmount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (tokenAmount > (balance ?? 0)) {
      toast.error("Insufficient balance.");
      return;
    }

    try {
      await dispatch(
        transferTokens({
          toUserId: recipientId,
          amount: tokenAmount,
          note,
        }),
      ).unwrap();
      toast.success(`Sent ${tokenAmount} tokens to ${recipientName}!`);
      setAmount("");
      setNote("");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Transfer failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" /> Send Tokens
          </DialogTitle>
          <DialogDescription>
            Send tokens to <strong>{recipientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-muted/30">
            <span className="text-sm text-muted-foreground">Your Balance</span>
            <span className="text-sm font-semibold">
              {(balance ?? 0).toLocaleString()} tokens
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="Enter token amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={balance ?? 0}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Note (optional)</label>
            <Input
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={isLoading || !amount || parseInt(amount) <= 0}
            className="w-full cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" /> Send {amount || 0} Tokens
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
