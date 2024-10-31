import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { DatePickerWithRange } from "./dateDispo";
import { DatePickerDemo } from "./DatePicker";

export default function Company() {
  const [daysState, setDaysState] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [timeSlot, setTimeSlot] = useState([]);
  const [selectedOpeningHour, setSelectedOpeningHour] = useState(null);
  const [selectedClosingHour, setSelectedClosingHour] = useState();
  const [workingHours, setWorkingHours] = useState({});
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [specialDate, setSpecialDate] = useState(null);
  const [specialDays, setSpecialDays] = useState([]);
  const [specialDayHours, setSpecialDayHours] = useState({});

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      navigate("/");
    }
    fetchDays();
    getTime();
  }, [navigate]);

  const getTime = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/available-dates/working-hours"
      );
      const workingHoursData = response.data;

      const workingHoursMap = {};
      workingHoursData.forEach((item) => {
        workingHoursMap[item.day_of_week] = {
          start_hour: item.start_hour,
          end_hour: item.end_hour,
        };
      });

      setWorkingHours(workingHoursMap);

      const timeList = [];
      for (let i = 10; i <= 18; i++) {
        const hour = i < 10 ? "0" + i : i;
        const time = hour + ":00";
        timeList.push({ time });
      }

      setTimeSlot(timeList);
    } catch (error) {
      console.error("Error fetching working hours:", error);
    }
  };

  const fetchSpecialDays = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/available-dates/special-days"
      );
      const specialDaysData = response.data;
      specialDaysData.sort((a, b) => new Date(a.date) - new Date(b.date));
      // Initialize hours for each special day
      const initialHours = {};
      specialDaysData.forEach((day) => {
        initialHours[day.date] = {
          openingHour: day.opening_hour.slice(0, 5),
          closingHour: day.closing_hour.slice(0, 5),
        };
      });

      setSpecialDayHours(initialHours); // Store the hours for each special day
      setSpecialDays(specialDaysData); // Store special days
    } catch (error) {
      console.error("Error fetching special days:", error);
    }
  };

  useEffect(() => {
    fetchSpecialDays();
    // Initialize timeSlot array with available times
    const times = [];
    for (let i = 10; i <= 18; i++) {
      times.push(`${i < 10 ? "0" + i : i}:00`);
    }
    setTimeSlot(times);
  }, []);
  const fetchDays = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/indisponibilities"
      );
      if (response.data.length > 0) {
        // eslint-disable-next-line no-unused-vars
        const { id, ...days } = response.data[0];

        setDaysState(days);
      }
    } catch (error) {
      console.error("Error fetching days:", error);
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
        "https://appointment-fr-12d3.onrender.com/indisponibilities",
        {
          day: day.charAt(0).toUpperCase() + day.slice(1),
          value: updatedState,
        }
      );
      toast({
        description: `Day ${
          updatedState ? "added to" : "removed from"
        } unavailable days`,
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

  const handleChangeAvailableDates = async () => {
    console.log("Selected date range:", dateRange);

    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    toDate.setHours(23, 0, 0, 0); // Set hours to 23, minutes to 0, seconds to 0, milliseconds to 0
    fromDate.setHours(6, 0, 0, 0);

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

    if (!dateRange.to) {
      toast({
        description: `Please select an end date`,
        status: "warning",
        className: "bg-red-500",
      });
      return;
    }

    try {
      await axios.post(
        "https://appointment-fr-12d3.onrender.com/available-dates",
        {
          from_date: fromDate.toISOString(), // Convertir en format ISO
          to_date: toDate.toISOString(), // Convertir en format ISO
        }
      );
      toast({
        description: `Dates added successfully from ${fromDateStr} to ${toDateStr}`,
        status: "success",
        className: "bg-[#008000]",
      });
    } catch (error) {
      console.error("Error adding available dates:", error);
      toast({
        description: `Failed to add dates`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  const handleTimeSlotClick = (time) => {
    if (!selectedOpeningHour) {
      // Sélectionner l'heure d'ouverture
      setSelectedOpeningHour(time);
      setWorkingHours((prev) => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          start_hour: time.split(":")[0],
        },
      }));
    } else if (!selectedClosingHour) {
      // Sélectionner l'heure de fermeture
      if (time >= selectedOpeningHour) {
        setSelectedClosingHour(time);
        setWorkingHours((prev) => ({
          ...prev,
          [selectedDay]: {
            ...prev[selectedDay],
            end_hour: time.split(":")[0],
          },
        }));
      } else {
        toast({
          description: "The closing hour must be after the opening hour.",
          status: "warning",
          className: "bg-red-500",
        });
        setSelectedOpeningHour(null);
        setSelectedClosingHour(null);
      }
    } else {
      // Réinitialiser la sélection
      setSelectedOpeningHour(time);
      setSelectedClosingHour(null);
      setWorkingHours((prev) => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          start_hour: time.split(":")[0],
          end_hour: null,
        },
      }));
    }
  };

  const handleSpecialTimeSlotClick = (time, date) => {
    const currentHours = specialDayHours[date] || {
      openingHour: null,
      closingHour: null,
    };
    const openingHour = currentHours.openingHour;
    const closingHour = currentHours.closingHour;

    // Logic for setting opening and closing hours
    if (!openingHour) {
      setSpecialDayHours((prev) => ({
        ...prev,
        [date]: { openingHour: time, closingHour: null },
      }));
    } else if (!closingHour) {
      if (time >= openingHour) {
        setSpecialDayHours((prev) => ({
          ...prev,
          [date]: { ...prev[date], closingHour: time },
        }));
      } else {
        toast({
          description: "Closing hour must be after opening hour.",
          status: "warning",
          className: "bg-red-500",
        });
        setSpecialDayHours((prev) => ({
          ...prev,
          [date]: { openingHour: null, closingHour: null },
        }));
      }
    } else {
      if (time === openingHour) {
        console.log("Deselecting Opening Hour:", openingHour);
        setSpecialDayHours((prev) => ({
          ...prev,
          [date]: { ...prev[date], openingHour: null },
        }));
      } else if (time === closingHour) {
        setSpecialDayHours((prev) => ({
          ...prev,
          [date]: { ...prev[date], closingHour: null },
        }));
      } else {
        setSpecialDayHours((prev) => ({
          ...prev,
          [date]: { openingHour: time, closingHour: null },
        }));
      }
    }
  };

  const handleSaveSpecialTimes = async (date) => {
    const currentHours = specialDayHours[date];

    const addOneDay = (date) => {
      let newDate = new Date(date);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    };

    if (
      !currentHours ||
      !currentHours.openingHour ||
      !currentHours.closingHour ||
      !date
    ) {
      toast({
        description: "Please select both opening and closing hours and a date.",
        status: "warning",
        className: "bg-red-500",
      });
      return;
    }

    try {
      await axios.post(
        "https://appointment-fr-12d3.onrender.com/available-dates/special-days",
        {
          date: addOneDay(date),
          opening_hour: currentHours.openingHour + ":00",
          closing_hour: currentHours.closingHour + ":00",
        }
      );
      await fetchSpecialDays();
      toast({
        description: `Special day hours saved successfully for ${new Date(
          date
        ).toLocaleDateString()}.`,
        status: "success",
        className: "bg-[#008000]",
      });
    } catch (error) {
      console.error("Error saving special day hours:", error);
      toast({
        description: `Failed to save special day hours.`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  const handleChangeSpecialTimes = async (date) => {
    const currentHours = specialDayHours[date];

    try {
      await axios.post(
        "https://appointment-fr-12d3.onrender.com/available-dates/special-days",
        {
          date: date,
          opening_hour: currentHours.openingHour + ":00",
          closing_hour: currentHours.closingHour + ":00",
        }
      );
      await fetchSpecialDays();
      toast({
        description: `Special day hours saved successfully for ${new Date(
          date
        ).toLocaleDateString()}.`,
        status: "success",
        className: "bg-[#008000]",
      });
    } catch (error) {
      console.error("Error saving special day hours:", error);
      toast({
        description: `Failed to save special day hours.`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  const handleDeleteSpecialTimes = async (day) => {
    try {
      await axios.delete(
        `https://appointment-fr-12d3.onrender.com/available-dates/special-days/${day}`
      );
      await fetchSpecialDays();
      toast({
        description: `Special day hours deleted successfully for`,
        status: "success",
        className: "bg-[#008000]",
      });
    } catch (error) {
      console.error("Error deleted special day hours:", error);
      toast({
        description: `Failed to deleted special day hours.`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  const handleSaveTimes = async () => {
    if (!selectedOpeningHour || !selectedClosingHour) {
      toast({
        description: `Please select both opening and closing hours`,
        status: "warning",
        className: "bg-red-500",
      });
      return;
    }

    try {
      const updatedHours = {
        ...workingHours,
        [selectedDay]: {
          start_hour: selectedOpeningHour.split(":")[0],
          end_hour: selectedClosingHour.split(":")[0],
        },
      };

      await axios.post(
        "https://appointment-fr-12d3.onrender.com/available-dates/working-hours",
        {
          day_of_week: selectedDay,
          start_hour: selectedOpeningHour.split(":")[0],
          end_hour: selectedClosingHour.split(":")[0],
        }
      );

      toast({
        description: `Working hours saved successfully for ${selectedDay}.`,
        status: "success",
        className: "bg-[#008000]",
      });

      setWorkingHours(updatedHours);
      setSelectedOpeningHour(null);
      setSelectedClosingHour(null);
    } catch (error) {
      console.error("Error saving working hours:", error);
      toast({
        description: `Failed to save working hours.`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  return (
    <div className="flex flex-col w-full  justify-center items-center px-10 gap-2  xl:gap-20 text-white lg:flex-row">
      <div className="flex flex-col ">
        <h1 className="text-4xl font-bold mb-5">Available Dates</h1>
        <div className="flex flex-col">
          <div className="flex justify-center border border-indigo-500 p-2 rounded shadow-2xl bg-black w-full items-center flex-col">
            <div>
              <CardHeader className="space-y-1">
                <CardTitle>Available Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=" flex  gap-4">
                  {Object.keys(daysState).map((day, index) => (
                    <div key={index} className="flex items-center">
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
              <Toaster />
            </div>
            <DatePickerWithRange
              onSelect={setDateRange}
              className="w-full mt-8"
            />
          </div>

          <div className="mt-5">
            <Button type="submit" onClick={handleChangeAvailableDates}>
              Submit
            </Button>
          </div>
        </div>
        <div className="flex justify-between w-full">
          <div>
            <CardHeader className="space-y-1 mt-5">
              <CardTitle className="text-4xl font-bold mb-5">
                Available Hours (week)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center border border-indigo-500 p-5 rounded shadow-2xl bg-black w-full items-center flex-col">
                <Accordion type="single" collapsible className="w-full">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => {
                    const hours = workingHours[day] || {
                      start_hour: "00",
                      end_hour: "00",
                    };
                    const startTime = `${hours.start_hour}:00`;
                    const endTime = `${hours.end_hour}:00`;
                    return (
                      <AccordionItem value={day} key={day}>
                        <AccordionTrigger onClick={() => setSelectedDay(day)}>
                          {day}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-3 gap-2 h-full w-full">
                            {timeSlot.map((item, index) => {
                              const isSelectedOpeningHour =
                                item.time === startTime;
                              const isSelectedClosingHour =
                                item.time === endTime;

                              return (
                                <div
                                  onClick={() => handleTimeSlotClick(item.time)}
                                  key={index}
                                  className={`p-1 cursor-pointer border rounded-lg flex justify-center items-center text-center ${
                                    isSelectedOpeningHour ||
                                    isSelectedClosingHour
                                      ? "bg-primary text-white"
                                      : ""
                                  }`}
                                >
                                  {item.time}
                                  {isSelectedOpeningHour && (
                                    <span className="ml-2 text-green-300">
                                      Opening
                                    </span>
                                  )}
                                  {isSelectedClosingHour && (
                                    <span className="ml-2 text-red-300">
                                      Closing
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-5">
                            <Button
                              type="button"
                              onClick={() => {
                                setSelectedDay(day);
                                handleSaveTimes();
                              }}
                            >
                              Save Times for {day}
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </CardContent>
            <Toaster />
          </div>
          <div>
            <CardHeader className="space-y-1 mt-5">
              <CardTitle className="text-4xl font-bold mb-5">
                Special Days (hours-date)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center border border-indigo-500 p-5 rounded shadow-2xl bg-black w-full items-center flex-col">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="special-days">
                    <AccordionTrigger>
                      <div className="w-full flex justify-center">
                        <div className="flex justify-center gap-2 p-1 px-10 bg-primary rounded w-fit">
                          <Plus /> Add Special Day
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col">
                        <DatePickerDemo onSelect={setSpecialDate} />
                      </div>

                      {/* Only show time slots if a date is selected */}
                      {specialDate && (
                        <div className="grid grid-cols-3 gap-2 h-full w-full mt-4">
                          {timeSlot?.map((item, index) => {
                            const currentDate = specialDate;
                            const currentHours = specialDayHours[
                              currentDate
                            ] || {
                              openingHour: null,
                              closingHour: null,
                            };

                            const isSelectedSpecialOpeningHour =
                              item.time === currentHours.openingHour;
                            const isSelectedSpecialClosingHour =
                              item.time === currentHours.closingHour;

                            return (
                              <div
                                key={index}
                                onClick={() =>
                                  handleSpecialTimeSlotClick(
                                    item.time,
                                    currentDate
                                  )
                                }
                                className={`p-1 cursor-pointer border rounded-lg flex justify-center items-center text-center ${
                                  isSelectedSpecialOpeningHour ||
                                  isSelectedSpecialClosingHour
                                    ? "bg-primary text-white"
                                    : ""
                                }`}
                              >
                                {item.time}
                                {isSelectedSpecialOpeningHour && (
                                  <span className="ml-2 text-green-300">
                                    Opening
                                  </span>
                                )}
                                {isSelectedSpecialClosingHour && (
                                  <span className="ml-2 text-red-300">
                                    Closing
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={() => handleSaveSpecialTimes(specialDate)}
                        className="mt-5"
                      >
                        Save Special Day Times
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  {specialDays?.map((day, dayIndex) => {
                    const date = day.date; // Use the date to access hours
                    const currentHours = specialDayHours[date] || {
                      openingHour: null,
                      closingHour: null,
                    };

                    return (
                      <AccordionItem
                        key={dayIndex}
                        value={`special-day-${dayIndex}`}
                      >
                        <AccordionTrigger>
                          <div className="flex  justify-center  gap-5 items-center w-full">
                            {new Date(day.date).toLocaleDateString()}
                            <Trash2
                              className=" text-red-500 cursor-pointer hover:scale-150"
                              size={20}
                              onClick={() => handleDeleteSpecialTimes(day.id)}
                            />
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-3 gap-2 h-full w-full">
                            {timeSlot.map((item, index) => {
                              const isSelectedSpecialOpeningHour =
                                item.time === currentHours.openingHour;
                              const isSelectedSpecialClosingHour =
                                item.time === currentHours.closingHour;

                              return (
                                <div
                                  key={index}
                                  onClick={() =>
                                    handleSpecialTimeSlotClick(item.time, date)
                                  } // Pass the date
                                  className={`p-1 cursor-pointer border rounded-lg flex justify-center items-center text-center ${
                                    isSelectedSpecialOpeningHour ||
                                    isSelectedSpecialClosingHour
                                      ? "bg-primary text-white"
                                      : ""
                                  }`}
                                >
                                  {item.time}
                                  {isSelectedSpecialOpeningHour && (
                                    <span className="ml-2 text-green-300">
                                      Opening
                                    </span>
                                  )}
                                  {isSelectedSpecialClosingHour && (
                                    <span className="ml-2 text-red-300">
                                      Closing
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-5">
                            <Button
                              type="button"
                              onClick={() => handleChangeSpecialTimes(day.date)}
                            >
                              Save Special Times for{" "}
                              {new Date(day.date).toLocaleDateString()}
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </CardContent>
            <Toaster />
          </div>
        </div>
      </div>
    </div>
  );
}
