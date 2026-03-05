"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  getTransactions,
  clearAdminState,
} from "@/redux/features/admin/adminSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRightLeft, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ManageTransactions() {
  const dispatch = useAppDispatch();
  const {
    transactions,
    isTransactionsLoading,
    error,
    transactionsPage,
    transactionsTotalPages,
  } = useAppSelector((state) => state.admin);

  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(getTransactions({ page, limit: 20 }));
  }, [dispatch, page]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAdminState());
    }
  }, [error, dispatch]);

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < transactionsTotalPages) setPage(page + 1);
  };

  if (isTransactionsLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No transactions found.</p>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <CreditCard className="h-4 w-4 mr-2" />;
      case "transfer_sent":
      case "transfer_received":
        return <ArrowRightLeft className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case "purchase":
        return "default";
      case "transfer_received":
        return "secondary";
      case "transfer_sent":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance After</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction: any) => (
              <TableRow key={transaction._id} className="hover:bg-muted/50">
                <TableCell className="whitespace-nowrap">
                  {new Date(transaction.createdAt).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  {transaction.user ? (
                    <div>
                      <div className="font-medium">
                        {transaction.user.firstName} {transaction.user.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.user.email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Unknown User
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getTransactionBadgeVariant(transaction.type)}
                    className="flex items-center px-2 py-1"
                  >
                    {getTransactionIcon(transaction.type)}
                    {transaction.type.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {transaction.type === "purchase" && transaction.plan && (
                    <span className="text-sm">
                      Plan: {transaction.plan.name}
                      {transaction.amountMoney && (
                        <span className="text-muted-foreground ml-2">
                          (${transaction.amountMoney / 100})
                        </span>
                      )}
                    </span>
                  )}
                  {transaction.type === "transfer_sent" &&
                    transaction.toUser && (
                      <span className="text-sm text-muted-foreground">
                        To: {transaction.toUser.firstName}{" "}
                        {transaction.toUser.lastName}
                      </span>
                    )}
                  {transaction.type === "transfer_received" &&
                    transaction.fromUser && (
                      <span className="text-sm text-muted-foreground">
                        From: {transaction.fromUser.firstName}{" "}
                        {transaction.fromUser.lastName}
                      </span>
                    )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  <span
                    className={
                      transaction.type === "transfer_sent"
                        ? "text-red-500"
                        : "text-green-500"
                    }
                  >
                    {transaction.type === "transfer_sent" ? "-" : "+"}
                    {transaction.amount}
                  </span>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {transaction.balanceAfter}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {transactionsTotalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {transactionsPage} of {transactionsTotalPages}
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={page === 1 || isTransactionsLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={
                page === transactionsTotalPages || isTransactionsLoading
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
