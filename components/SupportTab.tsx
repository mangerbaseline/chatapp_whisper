"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Plus, MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSocket } from "@/components/SocketProvider";

interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface Transaction {
  _id: string;
  amount: number;
  amountMoney: number;
  currency: string;
  createdAt: string;
  plan: {
    _id: string;
    name: string;
    price: number;
    tokens: number;
  };
}

interface RefundRequest {
  _id: string;
  status: string;
  reason: string;
  refundAmount: number;
  percentageCut: number;
  tokensDeducted: number;
  adminNote: string;
  createdAt: string;
  transaction: {
    amount: number;
    amountMoney: number;
    currency: string;
    plan: {
      name: string;
    };
  };
}

export default function SupportTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(true);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const router = useRouter();
  const { socket } = useSocket();

  const fetchTickets = async () => {
    try {
      const res = await axios.get("/api/support");
      setTickets(res.data.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load your support tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      const res = await axios.get("/api/refund");
      setRefunds(res.data.data);
    } catch (error) {
      console.error("Error fetching refunds:", error);
    } finally {
      setRefundsLoading(false);
    }
  };

  const fetchPurchaseTransactions = async () => {
    try {
      const res = await axios.get("/api/tokens/history");
      const purchases = (res.data.data?.transactions || []).filter(
        (t: any) => t.type === "purchase",
      );
      setTransactions(purchases);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchRefunds();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    setIsCreating(true);
    try {
      const res = await axios.post("/api/support", { subject });
      toast.success("Support ticket created!");
      setIsOpen(false);
      setSubject("");

      const newTicket = res.data.data;

      if (socket) {
        try {
          const authUser = await axios.get("/api/auth/me");
          const name = authUser.data?.data?.firstName || "A user";

          const notifyRes = await axios.post("/api/admin/notifications", {
            type: "new_ticket",
            title: "New Support Ticket",
            message: `${name} opened ticket ${newTicket.ticketId}: ${subject}`,
            link: `/dashboard/admin-tickets/${newTicket._id}`,
            relatedId: newTicket._id,
          });
          socket.emit("admin:notify", notifyRes.data.data);
        } catch (e) {
          console.error("Failed to notify admins", e);
        }
      }

      router.push(`/support/${newTicket._id}`);
    } catch (error) {
      console.error("Failed to create ticket:", error);
      toast.error("Failed to create ticket");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenRefundDialog = () => {
    fetchPurchaseTransactions();
    setIsRefundOpen(true);
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxn) {
      toast.error("Please select a transaction");
      return;
    }
    if (!refundReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setIsSubmittingRefund(true);
    try {
      await axios.post("/api/refund", {
        transactionId: selectedTxn,
        reason: refundReason.trim(),
      });
      toast.success("Refund request submitted!");

      if (socket) {
        try {
          const authUser = await axios.get("/api/auth/me");
          const name = authUser.data?.data?.firstName || "A user";

          const notifyRes = await axios.post("/api/admin/notifications", {
            type: "new_refund_request",
            title: "New Refund Request",
            message: `${name} requested a refund.`,
            link: `/dashboard/admin-tickets?tab=refunds`,
            relatedId: res.data.data?._id,
          });
          socket.emit("admin:notify", notifyRes.data.data);
        } catch (e) {
          console.error("Failed to notify admins", e);
        }
      }

      setIsRefundOpen(false);
      setSelectedTxn("");
      setRefundReason("");
      fetchRefunds();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to submit refund request",
      );
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const refundStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "initiated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "refunded":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-muted/40 p-4 rounded-lg border border-border/50">
          <div>
            <h3 className="font-semibold text-foreground">Need help?</h3>
            <p className="text-sm text-muted-foreground">
              Create a new ticket to get in touch with our support team.
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateTicket}>
                <DialogHeader>
                  <DialogTitle>Create Support Ticket</DialogTitle>
                  <DialogDescription>
                    Briefly describe your issue. You can add more details and
                    files in the chat.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Issue with billing, App crash..."
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="cursor-pointer"
                    disabled={isCreating || !subject.trim()}
                  >
                    {isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <h4 className="font-medium text-foreground">Your Tickets</h4>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg bg-background/50">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">
              You have not created any support tickets yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tickets.map((ticket) => (
              <Link key={ticket._id} href={`/support/${ticket._id}`}>
                <div className="group border border-border/60 bg-background/50 rounded-xl p-4 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant={
                        ticket.status === "open" ? "default" : "secondary"
                      }
                    >
                      {ticket.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h5 className="font-medium text-sm truncate pr-4 group-hover:text-primary transition-colors">
                    {ticket.subject}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-between">
                    <span>ID: {ticket.ticketId}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium flex items-center">
                      View Chat &rarr;
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center bg-muted/40 p-4 rounded-lg border border-border/50">
          <div>
            <h3 className="font-semibold text-foreground">Refund Request</h3>
            <p className="text-sm text-muted-foreground">
              Request a refund for a wrong or unwanted plan purchase.
            </p>
          </div>
          <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 cursor-pointer"
                onClick={handleOpenRefundDialog}
              >
                <RotateCcw className="h-4 w-4" />
                Request Refund
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <form onSubmit={handleSubmitRefund}>
                <DialogHeader>
                  <DialogTitle>Request Refund</DialogTitle>
                  <DialogDescription>
                    Select the purchase you want refunded and tell us why. A
                    platform fee may apply.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Purchase Transaction</Label>
                    <Select value={selectedTxn} onValueChange={setSelectedTxn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a purchase..." />
                      </SelectTrigger>
                      <SelectContent>
                        {transactions.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No purchases found
                          </SelectItem>
                        ) : (
                          transactions.map((t) => (
                            <SelectItem key={t._id} value={t._id}>
                              {t.plan?.name || "Plan"} &mdash; {t.amount} tokens
                              ({new Date(t.createdAt).toLocaleDateString()})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Explain why you need a refund..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRefundOpen(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="cursor-pointer"
                    disabled={
                      isSubmittingRefund || !selectedTxn || !refundReason.trim()
                    }
                  >
                    {isSubmittingRefund && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Request
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <h4 className="font-medium text-foreground">Your Refund Requests</h4>

        {refundsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : refunds.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg bg-background/50">
            <RotateCcw className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">
              No refund requests yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {refunds.map((refund) => (
              <div
                key={refund._id}
                className="border border-border/60 bg-background/50 rounded-xl p-4 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant="outline"
                    className={refundStatusColor(refund.status)}
                  >
                    {refund.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(refund.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h5 className="font-medium text-sm">
                  {refund.transaction?.plan?.name || "Plan"}
                </h5>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {refund.reason}
                </p>
                {refund.status === "approved" && (
                  <p className="text-xs text-green-600 mt-1.5 font-medium">
                    Refunded Rs.{refund.refundAmount / 100} (
                    {refund.percentageCut}% fee)
                  </p>
                )}
                {refund.status === "rejected" && refund.adminNote && (
                  <p className="text-xs text-destructive mt-1.5">
                    Note: {refund.adminNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
