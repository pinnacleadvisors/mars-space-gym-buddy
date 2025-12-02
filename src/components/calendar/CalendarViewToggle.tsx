"use client";

import { Button } from "@/components/ui/button";
import { CalendarDays, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarViewToggleProps {
  viewMode: "weekly" | "monthly";
  onViewModeChange: (mode: "weekly" | "monthly") => void;
  className?: string;
}

export const CalendarViewToggle = ({
  viewMode,
  onViewModeChange,
  className,
}: CalendarViewToggleProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={viewMode === "weekly" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("weekly")}
      >
        <CalendarDays className="w-4 h-4 mr-2" />
        Weekly
      </Button>
      <Button
        variant={viewMode === "monthly" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("monthly")}
      >
        <Calendar className="w-4 h-4 mr-2" />
        Monthly
      </Button>
    </div>
  );
};

