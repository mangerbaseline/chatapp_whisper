"use client";

import * as React from "react";
import { useRef, useEffect } from "react";
import InviteNotificationBadge from "@/components/chat/InviteNotificationBadge";
import PendingInvitesDialog from "@/components/chat/PendingInvitesDialog";
import { useSocket } from "@/components/SocketProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchInvitations,
  addReceivedInvitation,
} from "@/redux/features/connections/connectionsSlice";

export default function InviteNotifications() {
  const [invitesDialogOpen, setInvitesDialogOpen] = React.useState(false);
  const { socket } = useSocket();
  const dispatch = useAppDispatch();
  const receivedInvitations = useAppSelector(
    (state) => state.connections.receivedInvitations,
  );
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSoundRef.current = new Audio("/notification.wav");
    notificationSoundRef.current.volume = 0.5;
  }, []);

  React.useEffect(() => {
    dispatch(fetchInvitations({ type: "received", status: "pending" }));

    if (socket) {
      const handleInviteReceived = (invitation: any) => {
        dispatch(addReceivedInvitation(invitation));
        if (notificationSoundRef.current) {
          notificationSoundRef.current.currentTime = 0;
          notificationSoundRef.current.play().catch(() => {});
        }
      };

      socket.on("invite:received", handleInviteReceived);

      return () => {
        socket.off("invite:received", handleInviteReceived);
      };
    }
  }, [socket, dispatch]);

  return (
    <>
      <InviteNotificationBadge
        count={receivedInvitations.length}
        onClick={() => setInvitesDialogOpen(true)}
      />
      <PendingInvitesDialog
        open={invitesDialogOpen}
        onOpenChange={setInvitesDialogOpen}
      />
    </>
  );
}
