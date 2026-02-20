import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { updatePassword } from "@/redux/features/auth/authSlice";
import React, { useState } from "react";
import { updatePasswordSchema } from "@/verification/auth.verification";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export default function UpdatePassword() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = updatePasswordSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    try {
      await dispatch(updatePassword(formData)).unwrap();

      toast.success("Password updated successfully.");
      setFormData({
        currentPassword: "",
        newPassword: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Update failed.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <h3 className="font-medium text-foreground">Change Password</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-foreground">
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              className="bg-muted/50 border-border"
            />
            {errors.currentPassword && (
              <p className="text-destructive text-xs mt-1">
                {errors.currentPassword[0]}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-foreground">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              className="bg-muted/50 border-border"
            />
            {errors.newPassword && (
              <p className="text-destructive text-xs mt-1">
                {errors.newPassword[0]}
              </p>
            )}
          </div>
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={isLoading}
          className="text-muted-foreground bg-transparent cursor-pointer"
        >
          {isLoading ? "updating..." : "Update Password"}
        </Button>
      </div>
    </form>
  );
}
