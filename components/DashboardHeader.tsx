"use client";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

export default function DashboardHeader() {
  const user = useSelector((state: RootState) => state.auth.user);

  if (user) {
    return (
      <span className="text-md font-semibold">
        Welcome back,{" "}
        <span className="text-primary">
          {user?.firstName} {user?.lastName}
        </span>
        ! Here's what's happening.
      </span>
    );
  }

  return (
    <>
      <span className="text-md font-semibold">
        Welcome back, Here's what's happening.
      </span>
    </>
  );
}
