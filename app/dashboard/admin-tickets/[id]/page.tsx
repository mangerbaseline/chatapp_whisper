"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";

interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  status: string;
  createdAt: string;
  conversation: {
    _id: string;
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    image?: string;
  };
}

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await axios.get(`/api/support/${id}`);
        setTicket(res.data.data);
      } catch (error) {
        toast.error("Failed to load ticket details");
        console.error("Error fetching ticket:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchTicket();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await axios.patch(`/api/support/${id}`, {
        status: newStatus,
      });
      setTicket(res.data.data);
      toast.success("Ticket status updated");
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-xl font-semibold">Ticket not found</h2>
        <Button onClick={() => router.back()} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full">
      <div className="shrink-0 mb-6 bg-card border border-border/50 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/admin-tickets">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {ticket.ticketId}
              </h1>
              <Badge
                variant={ticket.status === "open" ? "default" : "secondary"}
              >
                {ticket.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium">
              {ticket.subject}
            </p>
            <div className="text-sm text-muted-foreground/80 mt-1 flex items-center gap-2">
              <span>
                User: {ticket.user?.firstName} {ticket.user?.lastName} (
                {ticket.user?.email})
              </span>
              <span>•</span>
              <span>
                Opened {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div>
          {ticket.status === "open" ? (
            <Button
              onClick={() => handleUpdateStatus("fulfilled")}
              disabled={isUpdating}
              className="w-full md:w-auto gap-2"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Mark as Fulfilled
            </Button>
          ) : (
            <Button
              onClick={() => handleUpdateStatus("open")}
              disabled={isUpdating}
              variant="outline"
              className="w-full md:w-auto"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reopen Ticket"
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-card border border-border/50 rounded-lg shadow-sm relative">
        <ChatWindow conversationId={ticket.conversation._id} />
      </div>
    </div>
  );
}
