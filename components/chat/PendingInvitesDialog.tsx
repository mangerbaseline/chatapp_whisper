"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchInvitations,
  acceptInvitation,
  rejectInvitation,
} from "@/redux/features/connections/connectionsSlice";
import { useSocket } from "@/components/SocketProvider";

interface PendingInvitesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteAccepted?: () => void;
}

export default function PendingInvitesDialog({
  open,
  onOpenChange,
  onInviteAccepted,
}: PendingInvitesDialogProps) {
  const dispatch = useAppDispatch();
  const { receivedInvitations, sentInvitations, loading } = useAppSelector(
    (state) => state.connections,
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (open) {
      dispatch(fetchInvitations({ type: "received", status: "pending" }));
      dispatch(fetchInvitations({ type: "sent", status: "pending" }));
    }
  }, [open, dispatch]);

  const handleAccept = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const resultAction = await dispatch(acceptInvitation(invitationId));
      if (acceptInvitation.fulfilled.match(resultAction)) {
        if (socket) {
          const invitation = receivedInvitations.find(
            (inv) => inv._id === invitationId,
          );
          if (invitation) {
            socket.emit("accept_invite", {
              senderId: invitation.sender._id,
              invitation: invitation,
            });
          }
        }
        if (onInviteAccepted) {
          onInviteAccepted();
        }
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const resultAction = await dispatch(rejectInvitation(invitationId));
      if (rejectInvitation.fulfilled.match(resultAction)) {
        if (socket) {
          const invitation = receivedInvitations.find(
            (inv) => inv._id === invitationId,
          );
          if (invitation) {
            socket.emit("reject_invite", {
              senderId: invitation.sender._id,
              invitation: invitation,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error rejecting invitation:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/40">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            Invitations
            {receivedInvitations.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {receivedInvitations.length} New
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="received" className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="received" className="mt-0">
            <ScrollArea className="h-[400px] px-6 py-4">
              {loading && receivedInvitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm">Loading invitations...</p>
                </div>
              ) : receivedInvitations.length > 0 ? (
                <div className="space-y-4">
                  {receivedInvitations.map((invite) => (
                    <div
                      key={invite._id}
                      className="group flex flex-col gap-3 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                          <AvatarImage src={invite.sender.image} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {invite.sender.firstName
                              ? invite.sender.firstName[0]
                              : invite.sender.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold truncate">
                            {invite.sender.firstName} {invite.sender.lastName}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            {invite.sender.email}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                            Sent {formatDate(invite.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 h-9"
                          onClick={() => handleAccept(invite._id)}
                          disabled={actionLoading === invite._id}
                        >
                          {actionLoading === invite._id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          onClick={() => handleReject(invite._id)}
                          disabled={actionLoading === invite._id}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Check className="h-6 w-6 opacity-30" />
                  </div>
                  <p className="text-sm font-medium">No pending invitations</p>
                  <p className="text-xs max-w-[200px] mt-1">
                    When someone sends you an invite, it will appear here.
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sent" className="mt-0">
            <ScrollArea className="h-[400px] px-6 py-4">
              {loading && sentInvitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm">Loading invitations...</p>
                </div>
              ) : sentInvitations.length > 0 ? (
                <div className="space-y-3">
                  {sentInvitations.map((invite) => (
                    <div
                      key={invite._id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card/50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={invite.receiver.image} />
                        <AvatarFallback>
                          {invite.receiver.firstName
                            ? invite.receiver.firstName[0]
                            : invite.receiver.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {invite.receiver.firstName} {invite.receiver.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {invite.receiver.email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full text-secondary-foreground">
                          Pending
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(invite.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                  <p className="text-sm font-medium">No sent invitations</p>
                  <p className="text-xs mt-1">
                    Search for users to send invites.
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
