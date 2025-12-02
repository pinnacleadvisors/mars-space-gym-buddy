"use client";

import { Button } from "@/components/ui/button";
import { CalendarDays, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CalendarViewToggleProps {
  viewMode: "daily" | "weekly" | "monthly";
  onViewModeChange: (mode: "daily" | "weekly" | "monthly") => void;
  className?: string;
}

const viewModeLabels = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const viewModeIcons = {
  daily: Calendar,
  weekly: CalendarDays,
  monthly: Calendar,
};

export const CalendarViewToggle = ({
  viewMode,
  onViewModeChange,
  className,
}: CalendarViewToggleProps) => {
  const Icon = viewModeIcons[viewMode];
  const label = viewModeLabels[viewMode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <Icon className="w-4 h-4" />
          {label}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={viewMode} onValueChange={(value) => onViewModeChange(value as "daily" | "weekly" | "monthly")}>
          <DropdownMenuRadioItem value="daily">
            <Calendar className="w-4 h-4 mr-2" />
            Daily
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="weekly">
            <CalendarDays className="w-4 h-4 mr-2" />
            Weekly
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="monthly">
            <Calendar className="w-4 h-4 mr-2" />
            Monthly
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

