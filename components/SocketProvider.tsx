"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { initializeSocket } from "@/lib/socket-client";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) return;

    const newSocket = initializeSocket();

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("online_users_list", ({ userIds }: { userIds: string[] }) => {
      setOnlineUsers(new Set(userIds));
    });

    newSocket.on("user_online", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });
    });

    newSocket.on("user_offline", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on(
      "event:reminder",
      (data: {
        eventId: string;
        title: string;
        description: string;
        startTime: string;
        organizer: string;
      }) => {
        toast(`🔔 ${data.title}`, {
          description: `Starting at ${data.startTime}${data.description ? ` — ${data.description}` : ""}`,
          duration: 10000,
        });
      },
    );

    setSocket(newSocket);

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.off("user_online");
        socket.off("user_offline");
        socket.off("event:reminder");
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
