"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Account {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  accountHolderName: string;
  bankName: string;
  routingNumber: string;
  last4: string;
  accountType: string;
  dobDay: number;
  dobMonth: number;
  dobYear: number;
  ssnLast4: string;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressPostalCode: string;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ConnectedAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchAccounts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        });
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);

        const res = await axios.get(
          `/api/admin/connected-accounts?${params.toString()}`,
        );
        setAccounts(res.data.data.requests);
        setPagination(res.data.data.pagination);
      } catch {
        toast.error("Failed to fetch connected accounts");
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter],
  );

  useEffect(() => {
    fetchAccounts(1);
  }, [fetchAccounts]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-600/20 text-green-600 hover:bg-green-600/30">
            Approved
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Connected Accounts
        </h1>
        <p className="text-sm text-muted-foreground">
          View all bank account link requests with identity details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>All Accounts</CardTitle>
              <CardDescription>
                {pagination.total} total records
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, email, bank..."
                  className="h-9 w-full sm:w-[250px]"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSearch}
                  className="h-9 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No connected accounts found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>SSN</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((acc) => (
                      <TableRow key={acc._id}>
                        <TableCell>
                          <div className="flex flex-col min-w-[140px]">
                            <span className="font-medium text-sm">
                              {acc.user?.firstName} {acc.user?.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {acc.user?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col min-w-[100px]">
                            <span className="text-sm font-medium">
                              {acc.bankName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {acc.accountHolderName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col min-w-[100px]">
                            <span className="text-sm font-mono">
                              ****{acc.last4}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {acc.routingNumber} · {acc.accountType}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {acc.dobMonth}/{acc.dobDay}/{acc.dobYear}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">
                            ***{acc.ssnLast4}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col min-w-[150px]">
                            <span className="text-sm">{acc.addressLine1}</span>
                            <span className="text-xs text-muted-foreground">
                              {acc.addressCity}, {acc.addressState}{" "}
                              {acc.addressPostalCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(acc.status)}</TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(acc.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchAccounts(pagination.page - 1)}
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchAccounts(pagination.page + 1)}
                    className="cursor-pointer"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
