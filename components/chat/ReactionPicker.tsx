"use client";

import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  trigger?: React.ReactNode;
  isSubMenu?: boolean;
}

export default function ReactionPicker({
  onSelect,
  className,
  side = "top",
  align = "start",
  trigger,
  isSubMenu = false,
}: ReactionPickerProps) {
  const { theme } = useTheme();

  const content = (
    <div onClick={(e) => e.stopPropagation()}>
      <EmojiPicker
        onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
        theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
        lazyLoadEmojis={true}
        skinTonesDisabled={true}
        searchDisabled={true}
        previewConfig={{ showPreview: false }}
        height={300}
        width={280}
      />
    </div>
  );

  if (isSubMenu) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className={className}>
          {trigger || (
            <>
              <Smile className="h-4 w-4 mr-2" />
              Add Reaction
            </>
          )}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent
          sideOffset={8}
          className="p-0 border-none bg-transparent shadow-none w-auto z-100"
        >
          {content}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-full text-muted-foreground hover:bg-accent",
              className,
            )}
          >
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="p-0 border-none bg-transparent shadow-none w-auto z-100"
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
