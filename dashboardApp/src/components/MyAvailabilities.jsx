import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";

import { DatePickerWithRange } from "./dateDispoEmployee";
import { DatePickerDemo } from "./DatePicker";

export default function MyAvailabilities() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [eyeIcon, setEyeIcon] = useState("eye");
  const [daysState, setDaysState] = useState([]);
  const [dayOffDate, setDayOffDate] = useState(null);
  const [daysOff, setDaysOff] = useState([]);
  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) {
      navigate("/");
    } else {
      fetchDays(user.email);
      fetchDaysOff(user.email);
    }
  }, [navigate]);

  const fetchDays = async (email) => {
    try {
      const response = await axios.get(
        `https://appointment-fr-12d3.onrender.com/employee/days`,
        {
          params: {
            email: email,
          },
        }
      );
      const daysData = response.data.reduce((acc, curr) => {
        acc[curr.day_of_week.toLowerCase()] = curr.available;
        return acc;
      }, {});
      setDaysState(daysData);
    } catch (error) {
      console.error("Error fetching days:", error);
    }
  };

  const fetchDaysOff = async (email) => {
    try {
      const response = await axios.get(
        `https://appointment-fr-12d3.onrender.com/employee/days-off`,
        {
          params: {
            email: email,
          },
        }
      );
      setDaysOff(response.data);
    } catch (error) {
      console.error("Error fetching days off:", error);
    }
  };

  const handleChangeAvailableDates = async () => {
    if (!dateRange.to) {
      toast({
        description: `Please select an end date`,
        status: "warning",
        className: "bg-red-500",
      });
      return;
    }

    const addOneDay = (date) => {
      let newDate = new Date(date);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    };
    const from_date_plus_one = addOneDay(dateRange.from);
    const to_date_plus_one = addOneDay(dateRange.to);

    try {
      await axios.post("https://appointment-fr-12d3.onrender.com/employee", {
        from_date: from_date_plus_one,
        to_date: to_date_plus_one,
        employee_email: JSON.parse(sessionStorage.getItem("user")).email,
      });
      const fromDateStr = `${dateRange.from.toLocaleDateString("en-EN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}`;

      const toDateStr = `${dateRange.to.toLocaleDateString("en-EN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}`;

      toast({
        description: `available dates changed successfully from ${fromDateStr} to ${toDateStr}`,
        status: "success",
        className: "bg-[#008000]",
      });

      setEyeIcon("eye"); // Mettre à jour l'icône de l'œil après le changement de disponibilité
    } catch (error) {
      console.error("Error adding available dates:", error);
      toast({
        description: `Failed to add dates`,
        status: "error",
        className: "bg-[#ff0000]",
      });
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
          email: JSON.parse(sessionStorage.getItem("user")).email,
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

  const handleAddDayOff = async () => {
    if (!dayOffDate) {
      toast({
        description: `Please select a day off date`,
        status: "warning",
        className: "bg-red-500",
      });
      return;
    }

    // Function to add one day to a date
    const addOneDay = (date) => {
      let newDate = new Date(date);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    };

    const adjustedDayOffDate = addOneDay(dayOffDate);

    // Check if the day off date is already present in daysOff
    const existingDayOff = daysOff.find(
      (dayOff) =>
        new Date(dayOff.day_off_date).toLocaleDateString() ===
        dayOffDate.toLocaleDateString()
    );
    if (existingDayOff) {
      toast({
        description: `Day off for ${adjustedDayOffDate.toLocaleDateString()} already exists`,
        status: "warning",
        className: "bg-red-500",
      });
      return;
    }

    try {
      // Envoyer la date de congé au backend pour l'ajouter
      await axios.post(
        "https://appointment-fr-12d3.onrender.com/employee/days-off",
        {
          email: JSON.parse(sessionStorage.getItem("user")).email,
          day_off_date: adjustedDayOffDate, // Utilisation de la date sélectionnée
        }
      );

      toast({
        description: `Day off added successfully`,
        status: "success",
        className: "bg-[#008000]",
      });
      const user = JSON.parse(sessionStorage.getItem("user"));

      fetchDaysOff(user.email);
    } catch (error) {
      console.error("Error adding day off:", error);
      toast({
        description: `Failed to add day off`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  const handleDeleteDayOff = async (dayOffId) => {
    try {
      await axios.delete(
        `https://appointment-fr-12d3.onrender.com/employee/days-off/${dayOffId}`
      );
      toast({
        description: `Day off deleted successfully`,
        status: "success",
        className: "bg-[#008000]",
      });
      const user = JSON.parse(sessionStorage.getItem("user"));
      fetchDaysOff(user.email); // Refresh the list of days off
    } catch (error) {
      console.error("Error deleting day off:", error);
      toast({
        description: `Failed to delete day off`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  return (
    <div className="flex flex-col w-full min-h-min justify-center items-center px-10 gap-2  xl:gap-20 text-white lg:flex-row">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold mb-5"> My Available Dates</h1>
        <div className="flex flex-col border border-indigo-500 p-2 rounded bg-black">
          <div className="flex justify-center  w-full items-center flex-col">
            <div>
              {" "}
              <CardHeader className="space-y-1">
                <CardTitle className="text-md">Available Days:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex  sm:flex-row flex-col gap-4">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex items-center">
                      <Checkbox
                        id={day}
                        checked={daysState[day]}
                        onCheckedChange={() => handleDayChange(day)}
                      />
                      <Label htmlFor={day} className="ml-2 capitalize">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>

            <DatePickerWithRange
              className="w-full mt-8"
              onSelect={setDateRange}
              eyeIcon={eyeIcon}
              setEyeIcon={setEyeIcon}
            />
          </div>

          <div className="mt-5">
            <Button type="submit" onClick={handleChangeAvailableDates}>
              Change date
            </Button>
          </div>
        </div>
      </div>
      <div>
        <div className="flex flex-col mt-5">
          <h1 className="text-2xl font-bold mb-5">Employee Days OFF</h1>
          <ScrollArea className="h-72  rounded-md border bg-black">
            <div className="p-4">
              <h4 className="mb-4 text-sm font-medium leading-none">
                Days Off
              </h4>
              {daysOff.map((dayOff) => (
                <div key={dayOff.id}>
                  <div className="text-sm flex flex-row-reverse justify-start">
                    <div className="flex justify-center w-full">
                      {new Date(dayOff.day_off_date).toLocaleDateString(
                        "fr-FR",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        }
                      )}
                    </div>
                    <Trash2
                      className="pb-2 text-red-500 cursor-pointer hover:scale-150"
                      onClick={() => handleDeleteDayOff(dayOff.id)}
                    />{" "}
                  </div>

                  <Separator className="my-2" />
                </div>
              ))}
            </div>
          </ScrollArea>
          <DatePickerDemo onSelect={setDayOffDate} />
        </div>
        <Button type="submit" className="my-5" onClick={handleAddDayOff}>
          Add Day Off
        </Button>
        <Toaster />
      </div>
    </div>
  );
}
