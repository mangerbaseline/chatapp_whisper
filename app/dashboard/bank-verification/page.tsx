"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Landmark, Check, X, User, ExternalLink, Loader2 } from "lucide-react";

interface Request {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  accountType: string;
  last4: string;
  status: string;
  createdAt: string;
}

export default function BankVerificationPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    try {
      const res = await axios.get("/api/admin/bank-verification");
      setRequests(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (
    requestId: string,
    status: "approved" | "rejected",
  ) => {
    setProcessingId(requestId);
    try {
      await axios.patch("/api/admin/bank-verification", {
        requestId,
        status,
        adminNote: adminNote[requestId] || "",
      });
      toast.success(`Request ${status} successfully`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Landmark className="h-6 w-6 text-primary" />
          Bank Verifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and approve bank account link requests for token redemptions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            {requests.length} requests awaiting your review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No pending verification requests.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Routing Number</TableHead>
                  <TableHead>Admin Note (Optional)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {request.user.firstName} {request.user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {request.user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {request.bankName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {request.accountHolderName}
                        </span>
                        <span className="text-xs font-mono">
                          ****{request.last4} ({request.accountType})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {request.routingNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Reason for rejection..."
                        className="h-8 text-xs max-w-[200px]"
                        value={adminNote[request._id] || ""}
                        onChange={(e) =>
                          setAdminNote({
                            ...adminNote,
                            [request._id]: e.target.value,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleAction(request._id, "rejected")}
                          disabled={processingId === request._id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleAction(request._id, "approved")}
                          disabled={processingId === request._id}
                        >
                          {processingId === request._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
