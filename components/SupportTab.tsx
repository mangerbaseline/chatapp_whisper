"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Plus, MessageSquare } from "lucide-react";
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
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Ticket {
  _id: string;
  ticketId: string;
  subject: string;
  status: string;
  createdAt: string;
}

export default function SupportTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

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

  useEffect(() => {
    fetchTickets();
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
      // Navigate straight to the new ticket chat
      router.push(`/support/${newTicket._id}`);
    } catch (error) {
      console.error("Failed to create ticket:", error);
      toast.error("Failed to create ticket");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="space-y-4">
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
    </div>
  );
}
