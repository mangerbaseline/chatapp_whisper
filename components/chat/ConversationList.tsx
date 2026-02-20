"use client";

import { useEffect } from "react";
import { useSocket } from "@/components/SocketProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchConversations,
  updateConversation,
} from "@/redux/features/chat/chatSlice";
import type { Conversation } from "@/redux/features/chat/chatSlice";
import Link from "next/link";

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export default function ConversationList({
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector((state) => state.chat.conversations);
  const { socket, isConnected, onlineUsers } = useSocket();
  const currentUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    dispatch(fetchConversations());

    const handleConversationUpdated = () => {
      dispatch(fetchConversations());
    };

    const handleNewConversation = (conversation: Conversation) => {
      dispatch(updateConversation(conversation));
    };

    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("new_conversation", handleNewConversation);

    return () => {
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("new_conversation", handleNewConversation);
    };
  }, [socket, isConnected, dispatch]);

  const getOtherParticipant = (conversation: Conversation) => {
    if (!currentUser) return conversation.participants[0];
    return (
      conversation.participants.find((p) => p._id !== currentUser._id) ||
      conversation.participants[0]
    );
  };

  return (
    <SidebarMenu className="mt-2">
      {conversations.map((conversation) => {
        const otherUser = getOtherParticipant(conversation);
        const isSelected = selectedConversationId === conversation._id;
        const isGroup = conversation.isGroup;
        const name = isGroup
          ? conversation.name
          : otherUser?.firstName || otherUser?.email || "Unknown";
        const avatarFallback = isGroup
          ? name?.[0]?.toUpperCase()
          : otherUser?.email?.[0]?.toUpperCase() || "?";
        const isOnline =
          !isGroup && otherUser?._id && onlineUsers.has(otherUser._id);

        return (
          <SidebarMenuItem key={conversation._id}>
            <SidebarMenuButton
              asChild
              isActive={isSelected}
              onClick={() => onSelectConversation(conversation._id)}
              className="h-auto py-3 cursor-pointer"
            >
              <Link href={"/"}>
                <div className="relative">
                  <Avatar className="h-8 w-8 shrink-0 border border-border">
                    <AvatarImage
                      src={otherUser?.image || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-accent/80 flex items-center justify-center text-xs font-semibold">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="font-medium truncate block">
                    {name} {!isGroup && otherUser?.lastName}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
