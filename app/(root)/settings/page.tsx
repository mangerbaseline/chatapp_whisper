"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Shield,
  AlertTriangle,
  Settings,
  HeadphonesIcon,
} from "lucide-react";
import Profile from "@/components/Profile";
import UpdatePassword from "@/components/UpdatePassword";
import DeleteAccount from "@/components/DeleteAccount";
import SupportTab from "@/components/SupportTab";

function SettingsTabs() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList className="bg-muted/50 flex-wrap h-auto p-1">
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Security</span>
        </TabsTrigger>
        <TabsTrigger value="appearance" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Account</span>
        </TabsTrigger>
        <TabsTrigger value="support" className="gap-2">
          <HeadphonesIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Support</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <Profile />
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <Card className="border-border/50 bg-card opacity-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-foreground">Security Settings</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your account security and authentication methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <UpdatePassword />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="appearance" className="space-y-6">
        <Card
          className="border-destructive/30 bg-destructive/5 opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-destructive/80">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <DeleteAccount />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="support" className="space-y-6">
        <Card
          className="border-border/50 bg-card opacity-0 animate-fade-in"
          style={{ animationDelay: "300ms" }}
        >
          <CardHeader>
            <CardTitle className="text-foreground">Support Tickets</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your support requests and communicate with our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupportTab />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default function SettingsPage() {
  return (
    <section className="px-2 py-4">
      <span className="text-md font-semibold mb-2 block">
        Manage your account preferences and configurations.
      </span>
      <Suspense
        fallback={<div className="animate-pulse h-96 bg-muted/20 rounded-lg" />}
      >
        <SettingsTabs />
      </Suspense>
    </section>
  );
}
