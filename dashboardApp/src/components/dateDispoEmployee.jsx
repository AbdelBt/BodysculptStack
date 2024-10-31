import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import PropTypes from "prop-types";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export function DatePickerWithRange({
  className,
  onSelect,
  eyeIcon,
  setEyeIcon,
}) {
  const [availableDates, setAvailableDates] = useState([]);
  const [userId, setUserId] = useState(null);
  const [date, setDate] = useState({
    from: null,
    to: null,
  });
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();
  const [daysState, setDaysState] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
  });

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    setUserEmail(user.email);
    setUserId(user.email);

    fetchAvailableDates(user.email);
  }, []);

  const fetchAvailableDates = async (email) => {
    try {
      const response = await axios.get(
        `https://appointment-fr-12d3.onrender.com/employee?employee_email=${email}`
      );
      setAvailableDates(response.data);
      if (response.data.length > 0) {
        const { from_date, to_date } = response.data[0];
        setDate({
          from: parseISO(from_date),
          to: parseISO(to_date),
        });
        setAvailableDates(response.data.map((date) => date.from_date));
        setEyeIcon("eye");
      } else {
        setEyeIcon("eye-off");
      }
    } catch (error) {
      console.error("Error fetching available dates:", error);
    }
  };

  const handleDayChange = async (day) => {
    const updatedState = !daysState[day];
    setDaysState((prevState) => ({
      ...prevState,
      [day]: updatedState,
    }));
    try {
      await axios.post(
        "https://appointment-fr-12d3.onrender.com/employee/days",
        {
          employee_email: JSON.parse(sessionStorage.getItem("user")).email,
          day_of_week: day,
          available: updatedState,
        }
      );
      toast({
        description: `Day ${
          updatedState ? "added to" : "removed from"
        } available days`,
        status: "success",
        className: "bg-[#008000]",
      });
    } catch (error) {
      console.error("Error updating day:", error);
      toast({
        description: `Failed to update day`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  const handleDeleteDateRange = async () => {
    try {
      if (!userId) {
        console.error("Error: userId is undefined or null.");
        return;
      }
      await axios.post(
        "https://appointment-fr-12d3.onrender.com/employee/delete-availability",
        {
          email: userId, // Utilisation de l'ID de l'utilisateur pour la suppression
        }
      );

      setDate({ from: null, to: null });
      onSelect({ from: null, to: null });
      setEyeIcon("eye-off");

      toast({
        description: "you are now unavailable",
        status: "success",
        className: "bg-[#008000]",
      });

      // Rafraîchir les données après la suppression
      fetchAvailableDates(userId);
    } catch (error) {
      console.error("Error deleting availability:", error);

      toast({
        description: "Failed to delete availability",
        status: "error",
        className: "bg-red-500",
      });
    }
  };

  useEffect(() => {
    onSelect(date);
  }, [date, onSelect]);

  return (
    <div className={cn("grid", className)}>
      <Button
        id="date"
        variant={"outline"}
        className={cn(
          "w-[300px] justify-start text-left font-normal mb-5",
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
          <span>No Available</span>
        )}
      </Button>
      <h1 className="font-black rounded bg-primary"> {userEmail}</h1>
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date?.from}
        selected={date}
        onSelect={setDate}
        numberOfMonths={2}
        daysState={daysState} // Pass daysState to Calendar component
        handleDayChange={handleDayChange} // Pass handleDayChange to Calendar component
      />
      <div className="flex justify-end">
        {eyeIcon === "eye" ? (
          <Eye
            className="w-10 h-10 cursor-pointer"
            onClick={handleDeleteDateRange}
          />
        ) : (
          <div className="flex w-1/2 flex-row-reverse justify-between items-center">
            <div className="">
              <EyeOff className="w-10 h-10 cursor-pointer" />
            </div>
            <div>
              <p className="text-md mt-1">( no available )</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

DatePickerWithRange.propTypes = {
  className: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  eyeIcon: PropTypes.string.isRequired,
  setEyeIcon: PropTypes.func.isRequired,
};
