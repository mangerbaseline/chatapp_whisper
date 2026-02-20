import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InviteNotificationBadgeProps {
  count: number;
  onClick: () => void;
}

export default function InviteNotificationBadge({
  count,
  onClick,
}: InviteNotificationBadgeProps) {
  return (
    <Button
      size="icon"
      variant="ghost"
      className="relative cursor-pointer h-8 w-8 rounded-full"
      onClick={onClick}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] animate-in zoom-in"
        >
          {count}
        </Badge>
      )}
    </Button>
  );
}
