"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, ArrowLeft } from "lucide-react";
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
}

export default function UserTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
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
    <div className="flex flex-col h-screen p-3 w-full">
      <div className="shrink-0 mb-6 bg-card border border-border/50 rounded-lg p-4 shadow-sm flex items-start gap-4 z-10 relative">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {ticket.ticketId}
            </h1>
            <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
              {ticket.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium">{ticket.subject}</p>
          <div className="text-sm text-muted-foreground/80 mt-1">
            Opened {new Date(ticket.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border/50 rounded-lg shadow-sm">
        {ticket.status === "fulfilled" && (
          <div className="bg-secondary/50 rounded-lg text-secondary-foreground p-2 text-center text-sm font-medium border-b border-border/30">
            This ticket has been marked as fulfilled. You can still view the
            chat history.
          </div>
        )}
        <ChatWindow conversationId={ticket.conversation._id} />
      </div>
    </div>
  );
}
