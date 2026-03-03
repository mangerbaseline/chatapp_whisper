"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Wallet,
  ArrowDownToLine,
  Clock,
  AlertCircle,
} from "lucide-react";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  stripeConnectAccountId?: string;
}

interface Redemption {
  _id: string;
  user: User;
  amount: number;
  balanceAfter: number;
  redemptionStatus: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function RedemptionRequests() {
  const [requests, setRequests] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Redemption | null>(
    null,
  );
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null,
  );

  const [amountMoney, setAmountMoney] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await axios.get("/api/admin/redemptions");
      setRequests(res.data.data);
    } catch {
      toast.error("Failed to fetch redemption requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openProcessDialog = (req: Redemption, action: "approve" | "reject") => {
    setSelectedRequest(req);
    setActionType(action);
    setAmountMoney("");
    setAdminNote("");
    setDialogOpen(true);
  };

  const handleProcess = async () => {
    if (!selectedRequest || !actionType) return;

    if (
      actionType === "approve" &&
      (!amountMoney || parseInt(amountMoney) <= 0)
    ) {
      toast.error("Valid payout amount is required for approval");
      return;
    }

    setProcessingId(selectedRequest._id);
    setDialogOpen(false);

    try {
      await axios.patch("/api/admin/redemptions", {
        transactionId: selectedRequest._id,
        action: actionType,
        amountMoney:
          actionType === "approve" ? parseInt(amountMoney) : undefined,
        currency: "usd",
        adminNote,
      });

      toast.success(`Redemption request ${actionType}d successfully!`);
      fetchRequests();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || `Failed to ${actionType} request`,
      );
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingRequests = requests.filter(
    (r) => r.redemptionStatus === "pending",
  );
  const processedRequests = requests.filter(
    (r) => r.redemptionStatus !== "pending",
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5 text-primary" /> Token Redemptions
        </h2>
        <p className="text-sm text-muted-foreground">
          Review and process user token redemption requests.
        </p>
      </div>

      {pendingRequests.length > 0 && (
        <Card className="border-amber-200/50 dark:border-amber-900/50 shadow-sm">
          <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-500">
              <Clock className="h-4 w-4" /> Pending Approval (
              {pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">User</TableHead>
                  <TableHead>Requested Tokens</TableHead>
                  <TableHead>Stripe Connect</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((req) => (
                  <TableRow key={req._id}>
                    <TableCell>
                      <p className="font-medium text-sm">
                        {req.user.firstName} {req.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.user.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-semibold text-amber-600 bg-amber-50"
                      >
                        {req.amount} tokens
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {req.user.stripeConnectAccountId ? (
                        <Badge
                          variant="outline"
                          className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30 text-[10px]"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Linked
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30 text-[10px]"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" /> Not Linked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                        disabled={
                          processingId === req._id ||
                          !req.user.stripeConnectAccountId
                        }
                        onClick={() => openProcessDialog(req, "approve")}
                      >
                        {processingId === req._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="cursor-pointer"
                        disabled={processingId === req._id}
                        onClick={() => openProcessDialog(req, "reject")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" /> Processed
            History
          </CardTitle>
          <CardDescription>
            Previously approved or rejected requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No processed history yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedRequests.map((req) => (
                  <TableRow key={req._id} className="text-muted-foreground">
                    <TableCell>
                      {req.user.firstName} {req.user.lastName}
                    </TableCell>
                    <TableCell>{req.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          req.redemptionStatus === "approved"
                            ? "border-green-500 text-green-600"
                            : "border-red-500 text-red-600"
                        }
                      >
                        {req.redemptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              className={
                actionType === "approve" ? "text-green-600" : "text-destructive"
              }
            >
              {actionType === "approve"
                ? "Approve Payout"
                : "Reject Redemption"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `You are approving a redemption of ${selectedRequest?.amount} tokens for ${selectedRequest?.user.firstName}.`
                : `Rejecting this will return the ${selectedRequest?.amount} tokens back to ${selectedRequest?.user.firstName}'s balance.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {actionType === "approve" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Payout Amount (in cents)
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 500 = $5.00"
                  value={amountMoney}
                  onChange={(e) => setAmountMoney(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This amount will be transferred to their linked Stripe account
                  instantly.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Internal Note (optional)
              </label>
              <Input
                placeholder={
                  actionType === "approve"
                    ? "Approval note..."
                    : "Reason for rejection..."
                }
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            <Button
              className={`w-full cursor-pointer ${actionType === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-destructive text-destructive-foreground"}`}
              onClick={handleProcess}
            >
              {actionType === "approve"
                ? "Confirm & Transfer Funds"
                : "Confirm Rejection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
