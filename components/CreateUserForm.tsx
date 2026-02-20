"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import DobPicker from "./DobPicker";
import { useState } from "react";
import { calculateAge } from "@/utils/ageCalculator";
import { Textarea } from "./ui/textarea";
import { registerSchema } from "@/verification/auth.verification";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  createUserByAdmin,
  clearAdminState,
} from "@/redux/features/admin/adminSlice";

type SignupFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  dob?: Date;
};

export function CreateUserForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.admin);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState<SignupFormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    dob: undefined,
  });

  const age = formData.dob ? calculateAge(formData.dob) : "";

  const zodPayload = {
    email: formData.email,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    firstName: formData.firstName,
    lastName: formData.lastName,
    address: formData.address,
    dateOfBirth: formData.dob
      ? formData.dob.toISOString().split("T")[0]
      : undefined,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse(zodPayload);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    const validatedData = result.data;

    try {
      await dispatch(
        createUserByAdmin({
          email: validatedData.email,
          password: validatedData.password,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          address: validatedData.address,
          dateOfBirth: validatedData.dateOfBirth,
        }),
      ).unwrap();

      toast.success("User created successfully");
      dispatch(clearAdminState());
    } catch (err: any) {
      toast.error(err?.message || "Failed to create user");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDobChange = (date?: Date) => {
    setFormData((prev) => ({
      ...prev,
      dob: date,
    }));
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent>
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <Link href={"/"} className="text-2xl font-bold">
                  Redux Auth
                </Link>
                <p className="text-muted-foreground text-sm text-balance">
                  Enter your email below to create your account
                </p>
              </div>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="first-name">First Name</FieldLabel>
                    <Input
                      id="first-name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      type="text"
                      required
                      placeholder="Alex"
                    />
                    <FieldDescription>
                      {errors.firstName && (
                        <p className="text-destructive text-xs mt-1">
                          {errors.firstName[0]}
                        </p>
                      )}
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
                    <Input
                      id="last-name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      type="text"
                      required
                      placeholder="Morgan"
                    />
                    <FieldDescription>
                      {errors.lastName && (
                        <p className="text-destructive text-xs mt-1">
                          {errors.lastName[0]}
                        </p>
                      )}
                    </FieldDescription>
                  </Field>
                </Field>
              </Field>
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
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="********"
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
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="********"
                    />
                    <FieldDescription>
                      {errors.confirmPassword && (
                        <p className="text-destructive text-xs mt-1">
                          {errors.confirmPassword[0]}
                        </p>
                      )}
                    </FieldDescription>
                  </Field>
                </Field>
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <DobPicker value={formData.dob} onChange={handleDobChange} />
                  {errors.dateOfBirth && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.dateOfBirth[0]}
                    </p>
                  )}
                  <Field>
                    <FieldLabel htmlFor="age">Age</FieldLabel>
                    <Input
                      id="age"
                      type="number"
                      value={age}
                      readOnly
                      disabled
                      placeholder="Age"
                    />
                  </Field>
                </Field>
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter your address"
                />
                <FieldDescription>
                  {errors.address && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.address[0]}
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
                  {isLoading ? "Creating user..." : "Create User"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
