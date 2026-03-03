"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchBalance,
  fetchPlans,
  fetchHistory,
  fetchConnectStatus,
  createCheckoutSession,
  verifyPurchase,
  redeemTokens,
  createConnectLink,
  clearWalletState,
} from "@/redux/features/wallet/walletSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Coins,
  CreditCard,
  Send,
  ArrowDownToLine,
  History,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Wallet as WalletIcon,
} from "lucide-react";

export default function Wallet() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const {
    balance,
    plans,
    transactions,
    totalPages,
    currentPage,
    connectStatus,
    isLoading,
    error,
    successMessage,
  } = useAppSelector((state) => state.wallet);

  const [redeemAmount, setRedeemAmount] = useState("");
  const [activeTab, setActiveTab] = useState("buy");

  useEffect(() => {
    dispatch(fetchBalance());
    dispatch(fetchPlans());
    dispatch(fetchHistory({ page: 1 }));
    dispatch(fetchConnectStatus());
  }, [dispatch]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      dispatch(verifyPurchase(sessionId)).then(() => {
        dispatch(fetchBalance());
        dispatch(fetchHistory({ page: 1 }));
      });
      window.history.replaceState({}, "", "/wallet");
    }
  }, [searchParams, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearWalletState());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearWalletState());
    }
  }, [error, dispatch]);

  const handleBuyTokens = async (planId: string) => {
    const result = await dispatch(createCheckoutSession(planId)).unwrap();
    if (result?.url) {
      window.location.href = result.url;
    }
  };

  const handleRedeem = async () => {
    if (!redeemAmount || parseInt(redeemAmount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    await dispatch(redeemTokens({ amount: parseInt(redeemAmount) })).unwrap();
    setRedeemAmount("");
    dispatch(fetchHistory({ page: 1 }));
  };

  const handleConnectStripe = async () => {
    const result = await dispatch(createConnectLink()).unwrap();
    if (result?.url) {
      window.location.href = result.url;
    }
  };

  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case "transfer_sent":
        return <Send className="h-4 w-4 text-red-500" />;
      case "transfer_received":
        return <ArrowDownToLine className="h-4 w-4 text-green-500" />;
      case "redemption":
        return <WalletIcon className="h-4 w-4 text-amber-500" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "purchase":
        return "Purchased";
      case "transfer_sent":
        return "Sent";
      case "transfer_received":
        return "Received";
      case "redemption":
        return "Redeemed";
      default:
        return type;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="bg-linear-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-sm">
            <Coins className="h-4 w-4" /> Token Balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold tracking-tight">
            {(balance ?? 0).toLocaleString()}
            <span className="text-lg text-muted-foreground ml-2">tokens</span>
          </div>
          {connectStatus && (
            <div className="mt-3">
              {connectStatus.connected && connectStatus.payoutsEnabled ? (
                <Badge
                  variant="outline"
                  className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30"
                >
                  <CheckCircle className="h-3 w-3 mr-1" /> Stripe Connected
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleConnectStripe}
                  disabled={isLoading}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {connectStatus.connected
                    ? "Complete Stripe Setup"
                    : "Link Bank Account"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="buy" className="cursor-pointer">
            <CreditCard className="h-4 w-4 mr-1.5 hidden sm:inline" /> Buy
          </TabsTrigger>
          <TabsTrigger value="redeem" className="cursor-pointer">
            <ArrowDownToLine className="h-4 w-4 mr-1.5 hidden sm:inline" />{" "}
            Redeem
          </TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">
            <History className="h-4 w-4 mr-1.5 hidden sm:inline" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4 mt-4">
          <h3 className="text-lg font-semibold">Choose a Plan</h3>
          {isLoading && plans.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan._id}
                  className="hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-primary/50" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {plan.description && (
                      <CardDescription>{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">
                        {formatCurrency(plan.price, plan.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {plan.tokens}
                      </span>{" "}
                      tokens
                    </div>
                    <Button
                      className="w-full cursor-pointer"
                      onClick={() => handleBuyTokens(plan._id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" /> Buy Now
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {plans.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-8">
              No plans available at the moment.
            </p>
          )}
        </TabsContent>

        <TabsContent value="redeem" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4 text-primary" /> Redeem
                Tokens
              </CardTitle>
              <CardDescription>
                Convert tokens back to money. Requires a linked Stripe account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectStatus && !connectStatus.connected ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-muted-foreground">
                    Link your bank account via Stripe to enable redemptions.
                  </p>
                  <Button onClick={handleConnectStripe} disabled={isLoading}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Link Bank Account
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Tokens to Redeem
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter token amount"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      min={1}
                      max={balance}
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {(balance ?? 0).toLocaleString()} tokens
                    </p>
                  </div>
                  <Button
                    onClick={handleRedeem}
                    disabled={isLoading || !redeemAmount}
                    className="w-full cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ArrowDownToLine className="h-4 w-4 mr-2" /> Request
                        Redemption
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Redemption requests are reviewed by admin before payout.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          {isLoading && transactions.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <Card
                  key={tx._id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {getTransactionLabel(tx.type)}
                          {tx.type === "transfer_sent" && tx.toUser
                            ? ` to ${tx.toUser.firstName || tx.toUser.email}`
                            : ""}
                          {tx.type === "transfer_received" && tx.fromUser
                            ? ` from ${tx.fromUser.firstName || tx.fromUser.email}`
                            : ""}
                          {tx.type === "purchase" && tx.plan
                            ? ` — ${tx.plan.name}`
                            : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}{" "}
                          {new Date(tx.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          tx.type === "transfer_sent" ||
                          tx.type === "redemption"
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {tx.type === "transfer_sent" || tx.type === "redemption"
                          ? "-"
                          : "+"}
                        {tx.amount}
                      </p>
                      {tx.type === "redemption" && tx.redemptionStatus && (
                        <Badge
                          variant="outline"
                          className={
                            tx.redemptionStatus === "approved"
                              ? "border-green-500 text-green-600 text-[10px]"
                              : tx.redemptionStatus === "rejected"
                                ? "border-red-500 text-red-600 text-[10px]"
                                : "border-amber-500 text-amber-600 text-[10px]"
                          }
                        >
                          {tx.redemptionStatus === "approved" && (
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {tx.redemptionStatus === "rejected" && (
                            <XCircle className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {tx.redemptionStatus === "pending" && (
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {tx.redemptionStatus}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      dispatch(fetchHistory({ page: currentPage - 1 }))
                    }
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground flex items-center">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      dispatch(fetchHistory({ page: currentPage + 1 }))
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
