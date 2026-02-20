"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCalendar from "@/components/calendar/EventCalendar";
import EventFormDialog from "@/components/calendar/EventFormDialog";
import EventList from "@/components/calendar/EventList";
import { useAppSelector } from "@/redux/hooks";
import axios from "axios";

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

export default function EventsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [monthEvents, setMonthEvents] = useState<EventItem[]>([]);
  const [dayEvents, setDayEvents] = useState<EventItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const user = useAppSelector((state) => state.auth.user);

  const fetchMonthEvents = useCallback(async () => {
    try {
      const monthStr = format(currentMonth, "yyyy-MM");
      const res = await axios.get(`/api/events?month=${monthStr}`);
      setMonthEvents(res.data.data || []);
    } catch (err) {
      console.error("Error fetching month events:", err);
    }
  }, [currentMonth]);

  const fetchDayEvents = useCallback(async () => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await axios.get(`/api/events?date=${dateStr}`);
      setDayEvents(res.data.data || []);
    } catch (err) {
      console.error("Error fetching day events:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthEvents();
  }, [fetchMonthEvents]);

  useEffect(() => {
    fetchDayEvents();
  }, [fetchDayEvents]);

  const handleEventCreated = () => {
    fetchMonthEvents();
    fetchDayEvents();
  };

  const handleEventDeleted = () => {
    fetchMonthEvents();
    fetchDayEvents();
  };

  const eventDots = React.useMemo(() => {
    const dotMap = new Map<string, string[]>();
    monthEvents.forEach((event) => {
      const d = new Date(event.date);
      const key = d.toDateString();
      const existing = dotMap.get(key) || [];
      existing.push(event.color || "#6366f1");
      dotMap.set(key, existing);
    });
    return Array.from(dotMap.entries()).map(([key, colors]) => ({
      date: new Date(key),
      colors,
    }));
  }, [monthEvents]);

  return (
    <div className="relative min-h-screen p-4 md:p-8 space-y-8 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/60 shadow-xl shadow-primary/20 text-primary-foreground">
              <CalendarIcon className="size-6" />
            </div>
            Event Scheduler
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Streamline your team's schedule. Plan meetings, track deadlines, and
            stay synchronized.
          </p>
        </div>

        <Button
          onClick={() => setIsFormOpen(true)}
          size="lg"
          className="h-12 px-6 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-base font-semibold cursor-pointer"
        >
          <Plus className="size-5 mr-2" />
          Create New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[calc(100vh-220px)] min-h-[600px]">
        <div className="lg:col-span-2 flex flex-col h-[500px] lg:h-full">
          <EventCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            eventDots={eventDots}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>

        <div className="lg:col-span-1 flex flex-col h-[500px] lg:h-full">
          <EventList
            events={dayEvents}
            selectedDate={selectedDate}
            currentUserId={user?._id}
            onDelete={handleEventDeleted}
            isLoading={isLoading}
          />
        </div>
      </div>

      <EventFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        selectedDate={selectedDate}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}
