"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Settings, Search, Link2, X, Users, CalendarDays } from "lucide-react";
import Link from "next/link";
import ConversationList from "@/components/chat/ConversationList";
import UserSearchDialog from "@/components/chat/UserSearchDialog";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { selectConversation } from "@/redux/features/chat/chatSlice";
import GroupChatModal from "./GroupChatModal";
import Image from "next/image";
import { ModeToggle } from "@/components/ModeToggle";
import UserDropdown from "@/components/UserDropdown";
import InviteNotifications from "../InviteNotifications";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";

export function ChatSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useDispatch();
  const selectedConversationId = useSelector(
    (state: RootState) => state.chat.selectedConversationId,
  );
  const { isMobile, setOpenMobile } = useSidebar();

  const handleSelectConversation = (id: string) => {
    dispatch(selectConversation(id));
  };

  return (
    <Sidebar
      className="h-screen border-r bg-sidebar border-slate-300"
      {...props}
    >
      <SidebarHeader className="h-16 border-b border-border/40 px-4 flex flex-row items-center justify-between bg-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-2" />
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/textLogo.png"
              alt="Logo"
              width={100}
              height={32}
              className="h-6 w-auto object-contain"
            />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <InviteNotifications />
          {isMobile && (
            <button
              onClick={() => setOpenMobile(false)}
              className="rounded-md p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="px-2 mb-2 w-full justify-between items-center sticky top-0 z-10 bg-sidebar/95 backdrop-blur-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Messages
            </span>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <UserSearchDialog
                  onSelectUser={(conversationId: string) => {
                    dispatch(selectConversation(conversationId));
                  }}
                  tooltip="Search Users"
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search Users</span>
                  </Button>
                </UserSearchDialog>

                <GroupChatModal
                  onSelectConversation={(conversationId: string) => {
                    dispatch(selectConversation(conversationId));
                  }}
                  tooltip="New Group Chat"
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    <span className="sr-only">New Group</span>
                  </Button>
                </GroupChatModal>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/connections">
                      <div className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-muted-foreground">
                        <Link2 className="h-4 w-4" />
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Connections</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ConversationList
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4 bg-sidebar/50">
        <div className="flex items-center justify-between gap-2">
          <UserDropdown />

          <div className="flex items-center gap-1">
            <ModeToggle />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/events">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Events</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/settings">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-muted-foreground">
                      <Settings className="h-4 w-4" />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
