"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  CalendarPlus,
  Clock,
  Users,
  Palette,
  Search,
  X,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

interface Participant {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
}

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  onEventCreated: () => void;
}

const EVENT_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
];

export default function EventFormDialog({
  open,
  onOpenChange,
  selectedDate,
  onEventCreated,
}: EventFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<
    Participant[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await axios.get(`/api/users/search?q=${query}`);
      const filtered = res.data.data.filter(
        (u: Participant) => !selectedParticipants.find((p) => p._id === u._id),
      );
      setSearchResults(filtered);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addParticipant = (user: Participant) => {
    setSelectedParticipants((prev) => [...prev, user]);
    setSearchResults((prev) => prev.filter((u) => u._id !== user._id));
    setSearchQuery("");
  };

  const removeParticipant = (userId: string) => {
    setSelectedParticipants((prev) => prev.filter((p) => p._id !== userId));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("09:00");
    setEndTime("10:00");
    setColor(EVENT_COLORS[0]);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedParticipants([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDate) return;

    setIsSubmitting(true);
    try {
      await axios.post("/api/events", {
        title: title.trim(),
        description: description.trim(),
        date: selectedDate.toISOString(),
        startTime,
        endTime,
        participants: selectedParticipants.map((p) => p._id),
        color,
      });
      resetForm();
      onOpenChange(false);
      onEventCreated();
    } catch (err) {
      console.error("Failed to create event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
              <CalendarPlus className="size-5 text-primary" />
            </div>
            <span>Create Event</span>
          </DialogTitle>
          <DialogDescription>
            {selectedDate
              ? `Schedule an event for ${format(selectedDate, "EEEE, MMMM d, yyyy")}`
              : "Select a date on the calendar first"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label
              htmlFor="event-title"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Event Title
            </Label>
            <Input
              id="event-title"
              placeholder="e.g. Team Standup, Design Review..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 text-base"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="event-desc"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="event-desc"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5" />
              Time
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1 h-11"
                required
              />
              <span className="text-muted-foreground text-sm font-medium">
                to
              </span>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex-1 h-11"
              />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Palette className="size-3.5" />
              Color
            </Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-8 rounded-full transition-all duration-200 hover:scale-110",
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                      : "opacity-60 hover:opacity-100",
                  )}
                  style={{
                    backgroundColor: c,
                    ...(color === c ? { ringColor: c } : {}),
                  }}
                />
              ))}
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5" />
              Participants
            </Label>

            {/* Selected participants */}
            {selectedParticipants.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedParticipants.map((p) => (
                  <span
                    key={p._id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {p.firstName} {p.lastName}
                    <button
                      type="button"
                      onClick={() => removeParticipant(p._id)}
                      className="ml-0.5 hover:text-destructive transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search users to invite..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 h-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-1 rounded-lg border bg-popover shadow-lg max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => addParticipant(user)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors text-sm"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !selectedDate}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CalendarPlus className="size-4" />
                  Create Event
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
