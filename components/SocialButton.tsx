"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type SocialButtonProps = {
  onClick?: () => void;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SocialButton({
  onClick,
  icon,
  children,
  className,
}: SocialButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "w-full h-10 rounded",
        "flex items-center justify-center gap-3",
        "border border-slate-300 bg-card",
        "text-sm font-medium text-foreground",
        "hover:bg-muted/60 transition-colors",
        "px-4 cursor-pointer truncate",
        className,
      )}
    >
      <span className="flex items-center justify-center w-5 h-5">{icon}</span>

      <span className="flex-1 text-center">{children}</span>

      <span className="w-5 h-5" />
    </Button>
  );
}
