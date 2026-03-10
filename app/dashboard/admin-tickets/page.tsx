"use client";

import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { Loader2, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  status: string;
  createdAt: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface RefundRequest {
  _id: string;
  status: string;
  reason: string;
  refundAmount: number;
  percentageCut: number;
  createdAt: string;
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
    plan: {
      name: string;
      price: number;
      tokens: number;
    };
  };
}

function TicketList() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const url = userId ? `/api/support?userId=${userId}` : "/api/support";
        const res = await axios.get(url);
        setTickets(res.data.data);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, [userId]);

  const filteredTickets = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      t.user?.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tickets..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {userId && (
          <Link href="/dashboard/admin-tickets">
            <Button variant="outline">Clear Filter</Button>
          </Link>
        )}
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No tickets found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket._id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {ticket.ticketId}
                  </TableCell>
                  <TableCell>
                    {ticket.user?.firstName} {ticket.user?.lastName}
                    <span className="block text-xs text-muted-foreground">
                      {ticket.user?.email}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.status === "open" ? "default" : "secondary"
                      }
                    >
                      {ticket.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/admin-tickets/${ticket._id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RefundList() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const res = await axios.get("/api/refund");
        setRefunds(res.data.data);
      } catch (error) {
        console.error("Error fetching refunds:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRefunds();
  }, []);

  const filteredRefunds = refunds.filter(
    (r) =>
      r.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase()) ||
      r.transaction?.plan?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const statusColor = (status: string) => {
    if (status === "pending") return "default";
    if (status === "initiated" || status === "refunded") return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search refund requests..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredRefunds.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No refund requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRefunds.map((refund) => (
                <TableRow key={refund._id} className="hover:bg-muted/50">
                  <TableCell>
                    {refund.user?.firstName} {refund.user?.lastName}
                    <span className="block text-xs text-muted-foreground">
                      {refund.user?.email}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {refund.transaction?.plan?.name || "N/A"}
                  </TableCell>
                  <TableCell>{refund.transaction?.amount}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {refund.reason}
                  </TableCell>
                  <TableCell>
                    {new Date(refund.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(refund.status)}>
                      {refund.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/admin-tickets/refund/${refund._id}`}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AdminTicketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get("tab") || "tickets";

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Support & Refunds
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage support tickets and refund requests.
        </p>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="refunds">Refund Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <TicketList />
        </TabsContent>

        <TabsContent value="refunds">
          <RefundList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminTicketsContent />
    </Suspense>
  );
}
