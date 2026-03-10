"use client";

import React, { useEffect, useState } from "react";
import InviteNotifications from "@/components/InviteNotifications";
import AdminNotifications from "@/components/AdminNotifications";
import { useAppSelector } from "@/redux/hooks";

export default function DashboardNotifications() {
  const user = useAppSelector((state) => state.auth.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return <div className="w-10 h-10" />;
  }

  if (user.role === "admin") {
    return <AdminNotifications />;
  }

  return <InviteNotifications />;
}
