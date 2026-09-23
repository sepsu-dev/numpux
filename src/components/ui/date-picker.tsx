"use client";

import * as React from "react";
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  X,
} from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse current selected date or fallback to current month
  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const [viewDate, setViewDate] = React.useState<Date>(() => {
    return selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();
  });

  React.useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) setViewDate(d);
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Compute days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
  };

  const formatDisplay = (val: string) => {
    try {
      const d = new Date(val + "T00:00:00");
      if (isNaN(d.getTime())) return val;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return val;
    }
  };

  // Build grid
  const daysArray = [];
  // Prev month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    daysArray.push({
      day: daysInPrevMonth - i,
      currentMonth: false,
      isPrev: true,
    });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({
      day: i,
      currentMonth: true,
      isSelected:
        selectedDate &&
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === i,
      isToday:
        new Date().getFullYear() === year &&
        new Date().getMonth() === month &&
        new Date().getDate() === i,
    });
  }
  // Next month padding
  const remaining = 42 - daysArray.length;
  for (let i = 1; i <= remaining; i++) {
    daysArray.push({
      day: i,
      currentMonth: false,
      isNext: true,
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full h-10 px-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-all flex items-center justify-between text-xs font-medium shadow-2xs outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarBlank size={14} className="text-muted-foreground shrink-0" />
            <span className="truncate">
              {value ? formatDisplay(value) : placeholder}
            </span>
          </div>
          {value && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <X size={12} />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[280px] p-3 text-xs bg-card border border-border shadow-xl rounded-2xl">
        {/* Header navigation */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <CaretLeft size={14} />
          </button>
          <span className="font-semibold text-foreground text-xs">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <CaretRight size={14} />
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {DAY_NAMES.map((d) => (
            <span key={d} className="text-[10px] font-semibold text-muted-foreground/70 py-0.5">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysArray.map((item, idx) => {
            if (!item.currentMonth) {
              return (
                <div
                  key={idx}
                  className="h-8 flex items-center justify-center text-[11px] text-muted-foreground/30 select-none"
                >
                  {item.day}
                </div>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectDay(item.day)}
                className={cn(
                  "h-8 rounded-lg flex items-center justify-center text-[11px] font-medium transition-all cursor-pointer",
                  item.isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : item.isToday
                    ? "bg-primary/10 text-primary font-bold border border-primary/30"
                    : "hover:bg-muted text-foreground"
                )}
              >
                {item.day}
              </button>
            );
          })}
        </div>

        {/* Quick action buttons */}
        <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              const formattedMonth = String(today.getMonth() + 1).padStart(2, "0");
              const formattedDay = String(today.getDate()).padStart(2, "0");
              onChange(`${today.getFullYear()}-${formattedMonth}-${formattedDay}`);
              setOpen(false);
            }}
            className="font-medium text-primary hover:underline cursor-pointer"
          >
            Today
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
