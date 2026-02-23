"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import { ShieldCheck, Mail, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ReactivatePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await axios.post("/api/auth/reactivate-request", { email });
      toast.success("OTP sent to your email!");
      setStep("otp");
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Failed to send OTP. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await axios.post("/api/auth/reactivate-verify", {
        email,
        otp,
      });
      const userData = res.data.data;
      dispatch(setUser(userData));
      toast.success("Account reactivated! Welcome back!");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 100);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "OTP verification failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Reactivate Your Account</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Your account was deactivated due to inactivity. Enter your email to receive a verification code."
              : "Enter the OTP sent to your email to reactivate your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>

              <div className="text-center text-sm">
                <Link
                  href="/auth/sign-in"
                  className="text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input type="email" value={email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 4-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={4}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Reactivate"
                )}
              </Button>

              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError(null);
                  }}
                  className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Change email
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleRequestOtp({
                      preventDefault: () => {},
                    } as React.FormEvent)
                  }
                  className="text-muted-foreground hover:text-primary cursor-pointer"
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
