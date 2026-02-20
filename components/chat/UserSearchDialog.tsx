"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  UserPlus,
  MessageCircle,
  Clock,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/components/SocketProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  searchUsers,
  sendInvitation,
  acceptInvitation,
  clearSearchResults,
} from "@/redux/features/connections/connectionsSlice";
import { createConversation } from "@/redux/features/chat/chatSlice";
import type { User } from "@/redux/features/connections/connectionsSlice";

interface UserSearchDialogProps {
  onSelectUser: (conversationId: string) => void;
  children?: React.ReactNode;
  tooltip?: string;
}

export default function UserSearchDialog({
  onSelectUser,
  children,
  tooltip,
}: UserSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { socket } = useSocket();
  const dispatch = useAppDispatch();
  const searchResults = useAppSelector(
    (state) => state.connections.searchResults,
  );
  const loading = useAppSelector((state) => state.connections.loading);

  useEffect(() => {
    if (open) {
      dispatch(clearSearchResults());
    } else {
      setQuery("");
      dispatch(clearSearchResults());
    }
  }, [open, dispatch]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length > 0) {
      dispatch(searchUsers(value));
    } else {
      dispatch(clearSearchResults());
    }
  };

  const handleStartChat = async (userId: string) => {
    setActionLoading(userId);
    try {
      const resultAction = await dispatch(
        createConversation({
          otherUserId: userId,
        }),
      );

      if (createConversation.fulfilled.match(resultAction)) {
        const conversation = resultAction.payload;

        if (socket) {
          socket.emit("conversation_created", {
            conversation: conversation,
            otherUserId: userId,
          });
        }

        onSelectUser(conversation._id);
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to start conversation", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvite = async (userId: string) => {
    setActionLoading(userId);
    try {
      const resultAction = await dispatch(sendInvitation(userId));

      if (sendInvitation.fulfilled.match(resultAction)) {
        const invitation = resultAction.payload;
        if (socket) {
          socket.emit("send_invite", {
            receiverId: userId,
            invitation: invitation,
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to send invitation", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptInvite = async (userId: string, invitationId?: string) => {
    if (!invitationId) return;

    setActionLoading(userId);
    try {
      const resultAction = await dispatch(acceptInvitation(invitationId));

      if (acceptInvitation.fulfilled.match(resultAction)) {
        if (socket) {
          socket.emit("accept_invite", {
            senderId: userId,
            invitation: { _id: invitationId, sender: { _id: userId } },
          });
        }
        dispatch(searchUsers(query));
      }
    } catch (error) {
      console.error("Failed to accept invitation", error);
    } finally {
      setActionLoading(null);
    }
  };

  const renderActionButton = (user: User) => {
    const isLoading = actionLoading === user._id;

    switch (user.inviteStatus) {
      case "connected":
        return (
          <Button
            size="sm"
            onClick={() => handleStartChat(user._id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-1" />
                Chat
              </>
            )}
          </Button>
        );

      case "pending_sent":
        return (
          <Button size="sm" variant="secondary" disabled>
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </Button>
        );

      case "pending_received":
        return (
          <Button
            size="sm"
            variant="default"
            onClick={() => handleAcceptInvite(user._id, user.invitationId)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Accept
              </>
            )}
          </Button>
        );

      default:
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSendInvite(user._id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1" />
                Invite
              </>
            )}
          </Button>
        );
    }
  };

  const trigger = (
    <DialogTrigger asChild>
      {children ? (
        children
      ) : (
        <Button size="sm" variant="secondary" className="cursor-pointer">
          <Search className="h-4 w-4" />
        </Button>
      )}
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <ScrollArea className="h-75">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {query.length === 0 && (
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-2">
                    Suggested Users
                  </p>
                )}
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="w-full flex items-center gap-3 p-2 rounded-lg border bg-card"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image} />
                      <AvatarFallback>
                        {user.firstName ? user.firstName[0] : user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {renderActionButton(user)}
                  </div>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No users found.
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                Type to search users...
              </p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
