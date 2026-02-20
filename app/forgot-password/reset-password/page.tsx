"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/redux/features/auth/authSlice";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error, resetToken, successMessage } = useAppSelector(
    (state) => state.auth,
  );

  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;

    const res = await dispatch(
      resetPassword({ resetToken, newPassword: password }),
    );

    if (resetPassword.fulfilled.match(res)) {
      router.push("/sign-in");
      if (successMessage) {
        toast.success(successMessage);
      } else {
        toast.error(error);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
