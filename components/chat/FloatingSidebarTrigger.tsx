"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingSidebarTrigger() {
  const { state, toggleSidebar, isMobile } = useSidebar();

  return (
    <div
      className={cn(
        "absolute top-2 left-2 z-50 transition-all duration-300 ease-in-out",
        !isMobile && state === "expanded"
          ? "opacity-0 pointer-events-none translate-x-4"
          : "opacity-100 translate-x-0",
      )}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9 bg-background/80 backdrop-blur-sm border-border shadow-sm hover:bg-background rounded-full"
      >
        <PanelLeft className="h-5 w-5 text-muted-foreground" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    </div>
  );
}
