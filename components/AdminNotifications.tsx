"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import {
  Bell,
  Check,
  Loader2,
  MessageSquare,
  Ticket,
  FileWarning,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/components/SocketProvider";
import { useRouter } from "next/navigation";

interface AdminNotification {
  _id?: string;
  type: "new_ticket" | "ticket_message" | "new_refund_request";
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

export default function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    notificationSoundRef.current = new Audio("/notification.wav");
    notificationSoundRef.current.volume = 0.5;

    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/admin/notifications?limit=25");
      setNotifications(res.data.data);
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.emit("join_admin");

      const handleAdminNotification = (payload: AdminNotification) => {
        const newNotif = {
          ...payload,
          isRead: false,
          _id: payload._id || Math.random().toString(),
        };

        setNotifications((prev) => [newNotif, ...prev]);

        if (notificationSoundRef.current) {
          notificationSoundRef.current.currentTime = 0;
          notificationSoundRef.current.play().catch(() => {});
        }
      };

      socket.on("admin:new_notification", handleAdminNotification);

      return () => {
        socket.off("admin:new_notification", handleAdminNotification);
      };
    }
  }, [socket]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
      await axios.patch("/api/admin/notifications", { notificationId });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await axios.patch("/api/admin/notifications", { markAllRead: true });
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    if (!notification.isRead && notification._id) {
      handleMarkAsRead(notification._id);
    }
    setOpen(false);
    router.push(notification.link);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "new_ticket":
        return <Ticket className="h-4 w-4 text-blue-500" />;
      case "ticket_message":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "new_refund_request":
        return <FileWarning className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-foreground"
          aria-label="Admin Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-background"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="font-semibold text-sm">Admin Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
              onClick={handleMarkAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif._id || Math.random().toString()}
                  className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notif.isRead ? "bg-muted/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="mt-1 bg-background rounded-full p-2 border shadow-xs">
                    {getIconForType(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p
                      className={`text-sm leading-none ${
                        !notif.isRead ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium pt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
