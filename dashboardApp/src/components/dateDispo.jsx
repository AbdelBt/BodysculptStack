"use client";

import { useEffect, useState } from "react";

import { addDays, format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import PropTypes from "prop-types";
import axios from "axios";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export function DatePickerWithRange({ className, onSelect }) {
  const [availableDates, setAvailableDates] = useState([]);
  const [date, setDate] = useState({
    from: null,
    to: null,
  });

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/available-dates"
      );
      setAvailableDates(response.data);
      if (response.data.length > 0) {
        const { from_date, to_date } = response.data[0];
        setDate({
          from: parseISO(from_date),
          to: parseISO(to_date),
        });
        setAvailableDates(response.data.map((date) => date.from_date));
      }
    } catch (error) {
      console.error("Error fetching available dates:", error);
    }
  };

  useEffect(() => {
    onSelect(date);
  }, [date, onSelect]);

  return (
    <div className={cn("grid gap-10", className)}>
      <Button
        id="date"
        variant={"outline"}
        className={cn(
          "w-[300px] justify-start text-left font-normal",
          !date && "text-white"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
            </>
          ) : (
            format(date.from, "LLL dd, y")
          )
        ) : (
          <span>Pick a date</span>
        )}
      </Button>
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date?.from}
        selected={date}
        onSelect={setDate}
        numberOfMonths={2}
      />
    </div>
  );
}

DatePickerWithRange.propTypes = {
  className: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};
