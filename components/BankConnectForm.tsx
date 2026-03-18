"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { submitBankDetails } from "@/redux/features/auth/authSlice";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { Landmark, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
];

export default function BankConnectForm() {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const initialDob = user?.dateOfBirth ? new Date(user.dateOfBirth) : null;

  const [formData, setFormData] = useState({
    accountHolderName:
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : "",
    accountNumber: "",
    routingNumber: "",
    bankName: "",
    accountType: "individual" as "individual" | "company",
    dobDay: initialDob ? initialDob.getDate().toString() : "",
    dobMonth: initialDob ? (initialDob.getMonth() + 1).toString() : "",
    dobYear: initialDob ? initialDob.getFullYear().toString() : "",
    addressLine1: "",
    addressCity: "",
    addressState: "",
    addressPostalCode: "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.mobileNo || "",
    fullSsn: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.accountHolderName ||
      !formData.accountNumber ||
      !formData.routingNumber ||
      !formData.bankName
    ) {
      toast.error("Please fill in all required bank fields.");
      return;
    }

    if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) {
      toast.error("Please enter your date of birth.");
      return;
    }

    if (
      !formData.addressLine1 ||
      !formData.addressCity ||
      !formData.addressState ||
      !formData.addressPostalCode
    ) {
      toast.error("Please fill in your full address.");
      return;
    }

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.fullSsn
    ) {
      toast.error("Please fill in your name, phone, and full SSN.");
      return;
    }

    try {
      await dispatch(submitBankDetails(formData)).unwrap();
      toast.success("Bank details submitted for verification.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit bank details.");
    }
  };

  if (user?.bankAccountStatus === "pending") {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Verification Pending</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your bank details are currently being reviewed by our admin team.
              This usually takes 24-48 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (user?.bankAccountStatus === "verified") {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Bank Account Linked</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your bank account ending in **{user.linkedBankLast4}** is verified
              and ready for redemptions.
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-2" disabled>
            Account Verified
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          <CardTitle>Link Bank Account</CardTitle>
        </div>
        <CardDescription>
          Connect your bank account to redeem your tokens for USD.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+12125551212"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHolderName">Account Holder Name</Label>
            <Input
              id="accountHolderName"
              placeholder="Full name as per bank records"
              value={formData.accountHolderName}
              onChange={(e) =>
                setFormData({ ...formData, accountHolderName: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g. Chase Bank"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                placeholder="9-digit Routing Number"
                value={formData.routingNumber}
                onChange={(e) =>
                  setFormData({ ...formData, routingNumber: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              type="password"
              placeholder="Enter your bank account number"
              value={formData.accountNumber}
              onChange={(e) =>
                setFormData({ ...formData, accountNumber: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Account Type</Label>
            <RadioGroup
              defaultValue="individual"
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  accountType: value as "individual" | "company",
                })
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="font-normal">
                  Individual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="font-normal">
                  Company
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="pt-2 border-t">
            <h4 className="text-sm font-semibold mb-3">
              Identity Verification (Required by Stripe)
            </h4>

            <div className="space-y-2 mb-4">
              <Label>Date of Birth</Label>
              <div className="grid grid-cols-3 gap-3">
                <Select
                  value={formData.dobMonth}
                  onValueChange={(v) =>
                    setFormData({ ...formData, dobMonth: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2000, i, 1).toLocaleString("en", {
                          month: "short",
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.dobDay}
                  onValueChange={(v) => setFormData({ ...formData, dobDay: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Year (e.g. 1990)"
                  value={formData.dobYear}
                  onChange={(e) =>
                    setFormData({ ...formData, dobYear: e.target.value })
                  }
                  min={1900}
                  max={2010}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="fullSsn">Full SSN / Tax ID</Label>
              <Input
                id="fullSsn"
                type="password"
                placeholder="Full SSN"
                value={formData.fullSsn}
                onChange={(e) =>
                  setFormData({ ...formData, fullSsn: e.target.value })
                }
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-3">
              <Label>US Address</Label>
              <Input
                placeholder="Street Address"
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine1: e.target.value })
                }
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="City"
                  value={formData.addressCity}
                  onChange={(e) =>
                    setFormData({ ...formData, addressCity: e.target.value })
                  }
                  required
                />
                <Select
                  onValueChange={(v) =>
                    setFormData({ ...formData, addressState: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="ZIP Code"
                  value={formData.addressPostalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      addressPostalCode: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {user?.bankAccountStatus === "rejected" && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Your previous request was rejected. Please ensure the details
                are correct and try again.
              </span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit for Verification"}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Your details are stored securely and used only for verification and
            payouts via Stripe.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
