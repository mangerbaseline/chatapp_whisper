import { AppSidebar } from "@/components/app-sidebar";
import InviteNotifications from "@/components/InviteNotifications";
import { ModeToggle } from "@/components/ModeToggle";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import UserDropdown from "@/components/UserDropdown";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "18rem",
          } as React.CSSProperties
        }
        className="flex flex-col"
      >
        <nav className="sticky top-0 z-50 p-2 shrink-0 flex items-center justify-between w-full bg-background">
          <div className="flex items-center justify-center gap-2">
            <Link href={"/"} className="cursor-pointer">
              <Image
                src="/textLogo.png"
                alt="Logo"
                width={100}
                height={100}
                className="ml-1"
              />
            </Link>
            <SidebarTrigger className="cursor-pointer" />
          </div>
          <div className="flex gap-2">
            <Field className="md:block hidden">
              <InputGroup>
                <InputGroupInput id="search" placeholder="search..." />
                <InputGroupAddon align="inline-end">
                  <InfoIcon />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <ModeToggle />
            <InviteNotifications />
            <UserDropdown />
          </div>
          <div className="pointer-events-none absolute -bottom-2 left-0 w-full h-2 bg-linear-to-b from-background to-transparent" />
        </nav>
        <div className="flex flex-1 my-1 px-2">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-y-auto relative">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
}
