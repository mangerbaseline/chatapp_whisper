"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

interface RefundDetail {
  _id: string;
  status: string;
  reason: string;
  refundAmount: number;
  percentageCut: number;
  tokensDeducted: number;
  adminNote: string;
  createdAt: string;
  processedAt?: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  transaction: {
    _id: string;
    amount: number;
    amountMoney: number;
    currency: string;
    createdAt: string;
    plan: {
      name: string;
      price: number;
      tokens: number;
      currency: string;
    };
  };
  processedBy?: {
    firstName: string;
    lastName: string;
  };
}

export default function AdminRefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [refund, setRefund] = useState<RefundDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [percentageCut, setPercentageCut] = useState(10);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    const fetchRefund = async () => {
      try {
        const res = await axios.get("/api/refund");
        const all = res.data.data;
        const found = all.find((r: any) => r._id === id);
        if (found) setRefund(found);
      } catch (error) {
        toast.error("Failed to load refund details");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchRefund();
  }, [id]);

  const handleProcess = async (status: "initiated" | "rejected") => {
    setIsProcessing(true);
    try {
      const res = await axios.patch(`/api/refund/${id}`, {
        status,
        percentageCut: status === "initiated" ? percentageCut : 0,
        adminNote,
      });
      setRefund(res.data.data);
      toast.success(
        status === "initiated"
          ? "Refund initiated successfully"
          : "Refund rejected",
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process refund");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-xl font-semibold">Refund request not found</h2>
        <Button onClick={() => router.back()} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  const originalTokens = refund.transaction?.amount || 0;
  const originalMoney = refund.transaction?.amountMoney || 0;
  const currency = (refund.transaction?.currency || "usd").toUpperCase();
  const previewRefundTokens = originalTokens;
  const previewRefundMoney = Math.floor(
    originalMoney * ((100 - percentageCut) / 100),
  );

  const statusColor =
    refund.status === "pending"
      ? "default"
      : refund.status === "initiated" || refund.status === "refunded"
        ? "secondary"
        : "destructive";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin-tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Refund Request
          </h1>
          <p className="text-muted-foreground text-sm">
            Submitted {new Date(refund.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={statusColor} className="ml-auto">
          {refund.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name: </span>
              <span className="font-medium">
                {refund.user?.firstName} {refund.user?.lastName}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Email: </span>
              <span className="font-medium">{refund.user?.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Original Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Plan: </span>
              <span className="font-medium">
                {refund.transaction?.plan?.name || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Tokens: </span>
              <span className="font-medium">{originalTokens}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Amount Paid: </span>
              <span className="font-medium">
                {(originalMoney / 100).toFixed(2)} {currency}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Purchased: </span>
              <span className="font-medium">
                {new Date(refund.transaction?.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Reason for Refund</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm bg-muted/40 p-3 rounded-lg">{refund.reason}</p>
        </CardContent>
      </Card>

      {refund.status === "pending" ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Process Refund</CardTitle>
            <CardDescription>
              Set the percentage cut and approve or reject this request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cut" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Platform Cut (%)
                </Label>
                <Input
                  id="cut"
                  type="number"
                  min={0}
                  max={100}
                  value={percentageCut}
                  onChange={(e) => setPercentageCut(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground font-medium">
                  Refund Preview
                </p>
                <div className="bg-background rounded-lg p-3 border space-y-1">
                  <p>
                    Tokens to deduct:{" "}
                    <span className="font-semibold">{previewRefundTokens}</span>
                  </p>
                  <p>
                    Money to refund:{" "}
                    <span className="font-semibold">
                      {(previewRefundMoney / 100).toFixed(2)} {currency}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Admin Note (optional)</Label>
              <Textarea
                id="note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note about this decision..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="destructive"
                onClick={() => handleProcess("rejected")}
                disabled={isProcessing}
                className="gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject
              </Button>
              <Button
                onClick={() => handleProcess("initiated")}
                disabled={isProcessing}
                className="gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Initiate Refund
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Status: </span>
              <Badge variant={statusColor}>{refund.status.toUpperCase()}</Badge>
            </div>
            {refund.status === "initiated" && (
              <>
                <div>
                  <span className="text-muted-foreground">Platform Cut: </span>
                  <span className="font-medium">{refund.percentageCut}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Tokens Deducted:{" "}
                  </span>
                  <span className="font-medium">{refund.tokensDeducted}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Refund Amount: </span>
                  <span className="font-medium">
                    {(refund.refundAmount / 100).toFixed(2)} {currency}
                  </span>
                </div>
              </>
            )}
            {refund.status === "refunded" && (
              <>
                <div>
                  <span className="text-muted-foreground">Platform Cut: </span>
                  <span className="font-medium">{refund.percentageCut}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Tokens Deducted:{" "}
                  </span>
                  <span className="font-medium">{refund.tokensDeducted}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Refund Amount: </span>
                  <span className="font-medium">
                    {(refund.refundAmount / 100).toFixed(2)} {currency}
                  </span>
                </div>
              </>
            )}
            {refund.adminNote && (
              <div>
                <span className="text-muted-foreground">Note: </span>
                <span>{refund.adminNote}</span>
              </div>
            )}
            {refund.processedBy && (
              <div>
                <span className="text-muted-foreground">Processed by: </span>
                <span className="font-medium">
                  {refund.processedBy.firstName} {refund.processedBy.lastName}
                </span>
              </div>
            )}
            {refund.processedAt && (
              <div>
                <span className="text-muted-foreground">Processed on: </span>
                <span>{new Date(refund.processedAt).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
