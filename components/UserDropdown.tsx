"use client";

import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { clearUser, logout } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage } from "./ui/avatar";

export default function UserDropdown() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const dispatch = useAppDispatch();
  const router = useRouter();

  if (!user) {
    return (
      <Link href="/auth/sign-in">
        <Button className="cursor-pointer hover:bg-primary/80">Sign In</Button>
      </Link>
    );
  }

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      dispatch(clearUser());
      toast.success("Logged out successfully.");
      setTimeout(() => {
        router.push("/auth/sign-in");
        router.refresh();
      }, 100);
    } catch (err: any) {
      toast.error(err?.message || "Logout failed.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 cursor-pointer"
        >
          <Avatar className="h-8 w-8 shrink-0 border border-border">
            <AvatarImage
              src={user?.image || "/man.png"}
              className="object-cover "
            />
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage
              src={user?.image || "/man.png"}
              className="object-cover"
            />
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {user?.role === "ADMIN" && (
          <>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard">
                <span className="font-semibold">Dashboard</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
