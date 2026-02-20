"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip, X, File, Film, Smile } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import axios from "axios";
interface MessageInputProps {
  conversationId: string;
  onSendMessage: (text: string, attachments?: any[]) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}

export default function MessageInput({
  conversationId,
  onSendMessage,
  onTyping,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<
    { url: string; type: string; name: string }[]
  >([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    onTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [
          ...prev,
          {
            url: reader.result as string,
            type: file.type,
            name: file.name,
          },
        ]);
      };
      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        setPreviews((prev) => [
          ...prev,
          {
            url: URL.createObjectURL(file),
            type: file.type,
            name: file.name,
          },
        ]);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    onTyping(true);
  };

  const handleSend = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || isLoading) return;

    setIsLoading(true);
    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        onTyping(false);
      }

      let attachments: any[] = [];

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });

        const uploadRes = await axios.post(
          `/api/upload?conversationId=${conversationId}`,
          formData,
        );
        attachments = uploadRes.data.data;
      }

      await onSendMessage(message, attachments);

      setMessage("");
      setSelectedFiles([]);
      setPreviews([]);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-background/40 backdrop-blur-md border border-border/40 rounded-xl overflow-x-auto max-h-32">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border/50 bg-background/50"
            >
              {preview.type.startsWith("image/") ? (
                <img
                  src={preview.url}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : preview.type.startsWith("video/") ? (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Film className="h-8 w-8 text-primary" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-1 text-[10px] text-center">
                  <File className="h-8 w-8 text-muted-foreground mb-1" />
                  <span className="truncate w-full">{preview.name}</span>
                </div>
              )}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 p-0.5 bg-background/80 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-2xl p-2 shadow-sm transition-all duration-300 focus-within:shadow-md focus-within:bg-background/80">
        <div className="flex items-end gap-2">
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mb-1 h-9 w-9 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-1 h-9 w-9 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
                disabled={isLoading}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="p-0 border-none bg-transparent shadow-none w-auto"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                lazyLoadEmojis={true}
              />
            </PopoverContent>
          </Popover>
          <Textarea
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[20px] max-h-[150px] resize-none border-0 focus-visible:ring-0 bg-transparent py-3 px-3 shadow-none text-sm placeholder:text-muted-foreground/70"
            disabled={isLoading}
            rows={1}
            style={{ height: "auto", minHeight: "44px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
            }}
          />
          <Button
            onClick={handleSend}
            disabled={
              (!message.trim() && selectedFiles.length === 0) || isLoading
            }
            size="icon"
            className="mb-1 h-9 w-9 shrink-0 rounded-xl transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
