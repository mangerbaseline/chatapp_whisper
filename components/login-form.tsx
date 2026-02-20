"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { login, clearAuthState } from "@/redux/features/auth/authSlice";
import { loginSchema } from "@/verification/auth.verification";
import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import GoogleLoginBtn from "./GoogleLoginBtn";
import GitHubLoginBtn from "./GitHubLoginBtn";
import { AuthAnimation } from "./auth-animation";
import Image from "next/image";

type LoginFormState = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  const [formData, setFormData] = useState<LoginFormState>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    dispatch(clearAuthState());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    try {
      const res = await dispatch(login(result.data)).unwrap();
      toast.success("Logged in successfully.");
      dispatch(setUser(res.data || res));
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 100);
    } catch (err: any) {
      toast.error(err?.message || "Login failed.");
    }
  };

  return (
    <Card className="overflow-hidden p-0 rounded-none border-0">
      <CardContent className="grid p-0 md:grid-cols-2">
        <form className="p-6 md:p-8" onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center text-center">
              <Link href="/" className="text-2xl font-bold">
                <Image src="/logo.png" alt="Logo" width={150} height={150} />
              </Link>
              <p className="text-muted-foreground text-sm font-semibold">
                Login to your Whispr account
              </p>
            </div>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="m@example.com"
                required
              />
              <FieldDescription>
                {errors.email && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.email[0]}
                  </p>
                )}
              </FieldDescription>
            </Field>

            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="ml-auto text-sm underline-offset-2 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <FieldDescription>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.password[0]}
                  </p>
                )}
              </FieldDescription>
            </Field>

            <Field>
              <Button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </Field>

            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              Or continue with
            </FieldSeparator>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <GoogleLoginBtn />
              <GitHubLoginBtn />
            </div>

            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up">Sign up</Link>
            </FieldDescription>

            <FieldDescription className="px-6 text-center">
              By clicking continue, you agree to our{" "}
              <Link href="#">Terms of Service</Link> and{" "}
              <Link href="#">Privacy Policy</Link>.
            </FieldDescription>
          </FieldGroup>
        </form>

        <div className="relative hidden md:block">
          <AuthAnimation />
        </div>
      </CardContent>
    </Card>
  );
}
