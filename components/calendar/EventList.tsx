"use client";

import { format } from "date-fns";
import { Clock, Trash2, User, Users, CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Participant {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
}

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  organizer: Participant;
  participants: Participant[];
  color: string;
  status: string;
}

interface EventListProps {
  events: EventItem[];
  selectedDate: Date | undefined;
  currentUserId: string | undefined;
  onDelete: () => void;
  isLoading: boolean;
}

export default function EventList({
  events,
  selectedDate,
  currentUserId,
  onDelete,
  isLoading,
}: EventListProps) {
  const handleDelete = async (eventId: string) => {
    try {
      await axios.delete(`/api/events/${eventId}`);
      onDelete();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  if (!selectedDate) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-secondary/10 mb-6 animate-pulse">
          <Clock className="size-10 text-secondary" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          No Date Selected
        </h3>
        <p className="text-muted-foreground max-w-[250px]">
          Select a date on the calendar to manage your schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/10 flex items-center justify-between bg-white/5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {format(selectedDate, "MMM d, yyyy")}
          </h2>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mt-1">
            {format(selectedDate, "EEEE")}
          </p>
        </div>
        <div className="flex items-center justify-center h-10 px-4 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-sm font-bold text-primary">
            {events.length} {events.length === 1 ? "Event" : "Events"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-muted/20 animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/10 mb-5">
              <CalendarX2 className="size-8 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-foreground">
              No events found
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              There are no events scheduled for this day.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              {events.map((event, index) => (
                <div
                  key={event._id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 hover:bg-card/80 transition-all duration-300",
                    "hover:shadow-lg hover:border-primary/20 hover:-translate-y-1",
                    "opacity-0 animate-fade-in",
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Decorative Color Bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2"
                    style={{ backgroundColor: event.color }}
                  />

                  <div className="p-5 pl-7">
                    {/* Top Row: Time & Delete */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span>
                          {event.startTime} - {event.endTime || "End"}
                        </span>
                      </div>
                      {currentUserId &&
                        event.organizer?._id === currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                            onClick={() => handleDelete(event._id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                    </div>

                    {/* Title & Desc */}
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {event.description}
                      </p>
                    )}

                    {/* Footer: Participants & Organizer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/10">
                      <div className="flex items-center -space-x-2">
                        {event.participants.slice(0, 4).map((p) => (
                          <Avatar
                            key={p._id}
                            className="size-8 border-2 border-background ring-2 ring-transparent transition-transform hover:z-10 hover:scale-110"
                          >
                            <AvatarImage src={p.image} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                              {p.firstName?.[0]}
                              {p.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {event.participants.length > 4 && (
                          <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-bold text-muted-foreground">
                            +{event.participants.length - 4}
                          </div>
                        )}
                        {event.participants.length === 0 && (
                          <span className="text-xs text-muted-foreground italic pl-2">
                            No participants
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Org:</span>
                        <Avatar className="size-6 border border-border/20">
                          <AvatarImage src={event.organizer?.image} />
                          <AvatarFallback className="text-[9px]">
                            {event.organizer?.firstName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
