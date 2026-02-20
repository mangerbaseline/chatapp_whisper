"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, X, Users as UsersIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/components/SocketProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  searchUsers,
  clearSearchResults,
} from "@/redux/features/connections/connectionsSlice";
import { createConversation } from "@/redux/features/chat/chatSlice";
import type { User } from "@/redux/features/connections/connectionsSlice";

interface GroupChatModalProps {
  onSelectConversation: (conversationId: string) => void;
  children?: React.ReactNode;
  tooltip?: string;
}

export default function GroupChatModal({
  onSelectConversation,
  children,
  tooltip,
}: GroupChatModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
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
      setSelectedUsers([]);
      setGroupName("");
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

  const toggleUser = (user: User) => {
    if (selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
      setQuery("");
      dispatch(clearSearchResults());
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    if (selectedUsers.length < 2) return;

    setCreating(true);
    try {
      const resultAction = await dispatch(
        createConversation({
          isGroup: true,
          name: groupName,
          members: selectedUsers.map((u) => u._id),
        }),
      );

      if (createConversation.fulfilled.match(resultAction)) {
        const conversation = resultAction.payload;

        if (socket) {
          socket.emit("conversation_created", {
            conversation: conversation,
            participantIds: selectedUsers.map((u) => u._id),
          });
        }

        onSelectConversation(conversation._id);
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to create group", error);
    } finally {
      setCreating(false);
    }
  };

  const trigger = (
    <DialogTrigger asChild>
      {children ? (
        children
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer w-full justify-start mb-1 border-none"
        >
          <UsersIcon className="h-4 w-4" />
          <span>New Group Chat</span>
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
          <DialogTitle>Create Group Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Project Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Participants</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUsers.map((user) => (
                <Badge
                  key={user._id}
                  variant="secondary"
                  className="shrink-0 flex items-center gap-1"
                >
                  {user.firstName}
                  <button
                    onClick={() => handleRemoveUser(user._id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-40 border rounded-md p-2">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults
                  .filter(
                    (user) =>
                      !selectedUsers.some(
                        (selected) => selected._id === user._id,
                      ),
                  )
                  .map((user) => (
                    <button
                      key={user._id}
                      onClick={() => toggleUser(user)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8">
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
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                {searchResults.filter(
                  (user) =>
                    !selectedUsers.some(
                      (selected) => selected._id === user._id,
                    ),
                ).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No new users found.
                  </p>
                )}
              </div>
            ) : query.length >= 2 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No users found.
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                {selectedUsers.length > 0
                  ? "Add more users..."
                  : "Search to add users"}
              </p>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length < 2 || creating}
            className="w-full"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
