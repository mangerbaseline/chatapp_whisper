"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Flame,
  Wallet,
  DollarSign,
  Users,
  ShieldCheck,
  Activity,
} from "lucide-react";

interface UserDetails {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  mobileNo?: string;
  provider?: string;
  image?: string;
  isActive: boolean;
  isDeactivated: boolean;
  lastSeen: string;
  consecutiveLoginDays: number;
  tokenBalance: number;
  connections: string[];
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  amountMoney?: number;
  currency?: string;
  note?: string;
  redemptionStatus?: string;
  plan?: { name: string; price: number; tokens: number };
  fromUser?: { firstName?: string; lastName?: string; email: string };
  toUser?: { firstName?: string; lastName?: string; email: string };
  createdAt: string;
}

interface DetailData {
  user: UserDetails;
  totalSpending: number;
  recentTransactions: Transaction[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
}

function getUserName(user: {
  firstName?: string;
  lastName?: string;
  email: string;
}) {
  if (user.firstName) return `${user.firstName} ${user.lastName || ""}`.trim();
  return user.email;
}

function getTransactionLabel(type: string) {
  switch (type) {
    case "purchase":
      return {
        label: "Purchase",
        color:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    case "transfer_sent":
      return {
        label: "Sent",
        color:
          "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      };
    case "transfer_received":
      return {
        label: "Received",
        color:
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    case "redemption":
      return {
        label: "Redemption",
        color:
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      };
    default:
      return { label: type, color: "" };
  }
}

function getTransactionDetail(tx: Transaction) {
  switch (tx.type) {
    case "purchase":
      return tx.plan ? tx.plan.name : "Token purchase";
    case "transfer_sent":
      return tx.toUser ? `To ${getUserName(tx.toUser)}` : "Transfer sent";
    case "transfer_received":
      return tx.fromUser
        ? `From ${getUserName(tx.fromUser)}`
        : "Transfer received";
    case "redemption":
      return tx.redemptionStatus
        ? `Status: ${tx.redemptionStatus.charAt(0).toUpperCase() + tx.redemptionStatus.slice(1)}`
        : "Redemption";
    default:
      return tx.note || "—";
  }
}

function DetailSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    axios
      .get(`/api/admin/users/${userId}/details`)
      .then((res) => setData(res.data.data))
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load user details");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <DetailSkeleton />;

  if (error || !data) {
    return (
      <div className="px-4 md:px-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/admin-users")}
          className="mb-4 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {error || "User not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, totalSpending, recentTransactions } = data;
  const displayName = getUserName(user);
  const initials = `${user.firstName?.[0] || ""}${(user.lastName?.[0] || user.email[0] || "").toUpperCase()}`;

  return (
    <div className="px-4 md:px-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 opacity-0 animate-fade-in">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.image} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl truncate">
                  {displayName}
                </CardTitle>
                <CardDescription className="truncate">
                  {user.email}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "outline"}
                  >
                    {user.role}
                  </Badge>
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "Enabled" : "Disabled"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      user.isDeactivated
                        ? "border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30"
                        : "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30"
                    }
                  >
                    {user.isDeactivated ? "Deactivated" : "Active"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {user.mobileNo && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.mobileNo}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.address}</span>
                </div>
              )}
              {user.dateOfBirth && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>DOB: {formatDate(user.dateOfBirth)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Joined: {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Last Seen: {formatTimeAgo(user.lastSeen)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-4 w-4 shrink-0" />
                <span>Login Streak: {user.consecutiveLoginDays} days</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>Connections: {user.connections?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  Provider:{" "}
                  {user.provider
                    ? user.provider.charAt(0).toUpperCase() +
                      user.provider.slice(1)
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card
            className="opacity-0 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                Total Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                ${totalSpending.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime purchase total
              </p>
            </CardContent>
          </Card>

          <Card
            className="opacity-0 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                Token Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {user.tokenBalance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current available tokens
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card
        className="opacity-0 animate-fade-in"
        style={{ animationDelay: "300ms" }}
      >
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Last 5 transactions for this user</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead className="hidden sm:table-cell">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Balance After
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => {
                  const { label, color } = getTransactionLabel(tx.type);
                  return (
                    <TableRow key={tx._id} className="hover:bg-muted/50">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(tx.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={color}>
                          {label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span
                          className={
                            tx.amount >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {tx.amount}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {tx.amountMoney
                          ? `$${tx.amountMoney.toFixed(2)} ${(tx.currency || "usd").toUpperCase()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {tx.balanceAfter.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-48 truncate">
                        {getTransactionDetail(tx)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
