"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";

const nav = {
  title: "Home",
  items: [
    {
      title: "Dashboard",
      url: "/dashboard",
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
    },
    {
      title: "Create User",
      url: "/dashboard/create-user",
    },
    {
      title: "Manage Users",
      url: "/dashboard/admin-users",
    },
    {
      title: "Settings",
      url: "/settings",
    },
  ],
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar
      variant="floating"
      className="mt-13 h-[calc(100vh-3rem)]"
      {...props}
    >
      {isMobile && (
        <SidebarHeader className="flex flex-row items-center justify-end p-4">
          <button
            onClick={() => setOpenMobile(false)}
            className="rounded-md p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </SidebarHeader>
      )}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {nav.items.map((item) => {
              const isActive =
                item.url === "/dashboard" || item.url === "/"
                  ? pathname === item.url
                  : pathname.startsWith(item.url);

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.url}>{item.title}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
