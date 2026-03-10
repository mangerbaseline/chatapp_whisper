"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchHistory,
  createCheckoutSession,
  verifyPurchase,
  clearWalletState,
  fetchBalance,
  fetchPlans,
} from "@/redux/features/wallet/walletSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    isLoading,
    error,
    successMessage,
  } = useAppSelector((state) => state.wallet);

  const [activeTab, setActiveTab] = useState("buy");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchBalance());
    dispatch(fetchPlans());
    dispatch(fetchHistory({ page: 1 }));
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
    setLoadingPlanId(planId);
    try {
      const result = await dispatch(createCheckoutSession(planId)).unwrap();
      if (result?.url) {
        window.location.href = result.url;
      }
    } finally {
      setLoadingPlanId(null);
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
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="buy" className="cursor-pointer">
            <CreditCard className="h-4 w-4 mr-1.5 hidden sm:inline" /> Buy
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
                      disabled={loadingPlanId === plan._id || isLoading}
                    >
                      {loadingPlanId === plan._id ? (
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
                          tx.type === "transfer_sent"
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {tx.type === "transfer_sent" ? "-" : "+"}
                        {tx.amount}
                      </p>
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
