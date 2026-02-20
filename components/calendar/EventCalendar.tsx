"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EventDot {
  date: Date;
  colors: string[];
}

interface EventCalendarProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  eventDots: EventDot[];
  month: Date;
  onMonthChange: (month: Date) => void;
}

export default function EventCalendar({
  selectedDate,
  onSelectDate,
  eventDots,
  month,
  onMonthChange,
}: EventCalendarProps) {
  const dotMap = new Map<string, string[]>();
  eventDots.forEach((dot) => {
    const key = dot.date.toDateString();
    dotMap.set(key, dot.colors);
  });

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => onMonthChange(subMonths(month, 1));
  const handleNextMonth = () => onMonthChange(addMonths(month, 1));

  return (
    <div className="w-full flex flex-col h-full bg-background/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {format(month, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground  cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2 px-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr gap-1 px-4 pb-6 flex-1 min-h-0">
        {days.map((day) => {
          const dateKey = day.toDateString();
          const colors = dotMap.get(dateKey) || [];
          const isSelected = selectedDate
            ? isSameDay(day, selectedDate)
            : false;
          const isCurrentMonth = isSameMonth(day, month);
          const isCurrentDay = isToday(day);

          return (
            <div key={day.toString()} className="relative flex flex-col">
              <button
                onClick={() => onSelectDate(day)}
                className={cn(
                  "relative h-full w-full rounded-xl flex flex-col items-center justify-start pt-3 transition-all duration-200 border border-transparent",
                  "hover:bg-accent/40 hover:scale-[1.02]",
                  isSelected &&
                    "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 z-10 hover:bg-primary hover:scale-105",
                  isCurrentDay &&
                    !isSelected &&
                    "bg-accent/20 text-accent ring-1 ring-accent/50 font-bold",
                  !isCurrentMonth && "opacity-30 hover:opacity-50 grayscale",
                  !isSelected && !isCurrentDay && "text-foreground",
                )}
              >
                <span className={cn("text-sm", isSelected && "font-semibold")}>
                  {format(day, "d")}
                </span>

                <div className="flex gap-0.5 mt-auto mb-2 px-1 w-full justify-center flex-wrap max-h-6 overflow-hidden">
                  {colors.slice(0, 4).map((color, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shadow-sm",
                        isSelected ? "ring-1 ring-white/30" : "",
                      )}
                      style={{
                        backgroundColor: isSelected ? "currentColor" : color,
                      }}
                    />
                  ))}
                  {colors.length > 4 && (
                    <span className="text-[8px] leading-3 text-muted-foreground ml-0.5">
                      +
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
