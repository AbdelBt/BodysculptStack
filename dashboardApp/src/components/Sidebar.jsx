import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  CalendarCheck,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  Building2,
  CalendarCog,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { Calendar } from "@/components/ui/calendar";
import { Toaster } from "@/components/ui/toaster";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function Sidebar({ handleLogout }) {
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [service, setService] = useState("");
  const [services, setServices] = useState([]);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");

  const [date, setDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState();
  const [unavailableDays, setUnavailableDays] = useState([]);
  const [employeeIds, setEmployeeIds] = useState([]);
  const [employeeDaysOff, setEmployeeDaysOff] = useState([]);
  const [employeeDaysOffWeek, setEmployeeDaysOffWeek] = useState([]);
  const [employeeAvailablePeriods, setEmployeeAvailablePeriods] = useState([]);
  const [availableDateRange, setAvailableDateRange] = useState({
    from: null,
    to: null,
  });
  const [Days, setDays] = useState([]);

  useEffect(() => {
    fetchDays();
  }, []);
  const fetchDays = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/indisponibilities"
      );
      if (response.data.length > 0) {
        // eslint-disable-next-line no-unused-vars
        const { id, ...days } = response.data[0]; // Exclure l'ID
        setDays(days); // Mettre à jour l'état avec les jours non disponibles
        const availableDatesResponse = await axios.get(
          "https://appointment-fr-12d3.onrender.com/available-dates"
        );
        if (availableDatesResponse.data.length > 0) {
          let { from_date, to_date } = availableDatesResponse.data[0];
          let fromDate = new Date(from_date);
          const toDate = new Date(to_date);
          fromDate.setDate(fromDate.getDate() - 1);

          setAvailableDateRange({
            from: new Date(fromDate),
            to: new Date(toDate),
          });
          console.log(availableDateRange);
        }
      }
    } catch (error) {
      console.error("Error fetching unavailable days:", error);
    }
  };

  const fetchUnavailableDays = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/reserve"
      );
      const { reservations, employeeIds } = response.data;
      const filteredEmployeeIds = employeeIds.filter((id) => id); // Supprime les valeurs null, undefined et vides

      setUnavailableDays(reservations);
      setEmployeeIds(filteredEmployeeIds);
    } catch (error) {
      console.error("Error fetching unavailable days:", error);
    }
  };

  const fetchEmployeeDaysoffWeek = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/employee/days/all"
      );
      const daysOffWeekData = response.data;

      // Filtrer les jours où available est false
      const filteredDaysOffWeek = daysOffWeekData.filter(
        (day) => !day.available
      );

      // Mettre à jour l'état des jours de congé des employés
      setEmployeeDaysOffWeek(filteredDaysOffWeek);

      return filteredDaysOffWeek;
    } catch (error) {
      console.error("Error fetching employee days off week:", error);
      return [];
    }
  };

  const fetchEmployeeAvailablePeriods = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/employee/all"
      );
      const availablePeriodsData = response.data;

      // Mettre à jour l'état des périodes de disponibilité des employés
      setEmployeeAvailablePeriods(availablePeriodsData);

      return availablePeriodsData;
    } catch (error) {
      console.error("Error fetching employee available periods:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchEmployeeDaysoffWeek();
    fetchEmployeeAvailablePeriods();
    fetchEmployeeDaysOff();
  }, []);

  const fetchEmployeeDaysOff = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/employee/days-off/all"
      );
      const daysOffData = response.data.daysOff;

      // Filtrer les jours de congé pour une date spécifique
      const currentDate = new Date(); // Date actuelle
      const filteredDaysOff = daysOffData.filter((dayOff) => {
        const dayOffDate = new Date(dayOff.day_off_date);
        return dayOffDate >= currentDate; // Filtrer pour les jours de congé à partir de la date actuelle
      });

      setEmployeeDaysOff(filteredDaysOff); // Mettre à jour l'état des jours de congé des employés

      return filteredDaysOff;
    } catch (error) {
      console.error("Error fetching employee days off:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchUnavailableDays();
  }, []);

  const formatPhoneNumber = (number) => {
    if (!number.startsWith("+")) {
      return "+" + number;
    }
    return number;
  };

  // Fonction pour récupérer les services depuis l'API
  const fetchServices = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/services"
      );
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const getTime = async () => {
    try {
      // Récupérer les horaires de travail depuis le backend
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/available-dates/working-hours"
      );
      const workingHours = response.data;

      const specialDaysResponse = await axios.get(
        "https://appointment-fr-12d3.onrender.com/available-dates/special-days"
      );
      const specialDays = specialDaysResponse.data;

      // Assurez-vous que date est définie et correspond au jour sélectionné
      const selectedDate = new Date(date);
      const selectedDay = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      const selectedDateFormatted = new Date(
        new Date(date).setDate(new Date(date).getDate() + 1)
      )
        .toISOString()
        .split("T")[0];

      // Check if the selected date is a special day
      const specialDay = specialDays.find(
        (day) => day.date === selectedDateFormatted
      );

      // Filtrer les horaires pour le jour sélectionné
      const dayHours = workingHours.find(
        (item) => item.day_of_week === selectedDay
      );

      // Création d'un tableau pour les créneaux horaires disponibles
      const timeList = [];

      // Utiliser les horaires récupérés pour définir les heures
      const startHour = specialDay
        ? parseInt(specialDay.opening_hour)
        : dayHours
        ? dayHours.start_hour
        : 10;
      const endHour = specialDay
        ? parseInt(specialDay.closing_hour)
        : dayHours
        ? dayHours.end_hour
        : 22;

      for (let i = startHour; i <= endHour; i++) {
        const hour = i < 10 ? "0" + i : i; // Formater l'heure pour avoir toujours deux chiffres
        const time = hour + ":00";

        // Fonction pour vérifier si le créneau est disponible
        const isUnavailable = isTimeUnavailableForDate(
          time,
          date,
          employeeIds,
          employeeDaysOff,
          unavailableDays,
          employeeDaysOffWeek,
          employeeAvailablePeriods
        );

        timeList.push({ time, isUnavailable });
      }

      setTimeSlot(timeList);
    } catch (error) {
      console.error("Erreur lors de la récupération des horaires :", error);
    }
  };

  useEffect(() => {
    if (date) {
      getTime(date);
      if (isTimeUnavailableForDate(selectedTimeSlot, date, employeeIds)) {
        setSelectedTimeSlot(null);
      }
    }
  }, [date, unavailableDays]);

  const isTimeUnavailableForDate = (time, date, employeeIds) => {
    if (!date) return false; // Si la date n'est pas définie, le créneau est disponible

    if (
      !Array.isArray(employeeDaysOff) ||
      !Array.isArray(employeeDaysOffWeek) ||
      !Array.isArray(employeeAvailablePeriods)
    ) {
      console.error(
        "Les données des jours de congé des employés ne sont pas un tableau"
      );
      return false; // Gérer le cas où les jours de congé des employés ne sont pas disponibles
    }

    // Tableau pour stocker les employés disponibles
    const availableEmployees = []; // Ajouté

    // Vérifier si le créneau est indisponible pour chaque employé
    const isAnyEmployeeAvailable = employeeIds.some((employeeId) => {
      // Vérifier si l'employé a un jour de congé hebdomadaire à la date sélectionnée
      const hasWeeklyDayOff = employeeDaysOffWeek.some((dayOffWeek) => {
        const dayOfWeekMapping = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };
        const isOff =
          dayOffWeek.employee_email === employeeId &&
          dayOfWeekMapping[dayOffWeek.day_of_week.toLowerCase()] ===
            date.getDay();

        return isOff;
      });

      if (hasWeeklyDayOff) {
        return false; // L'employé a un jour de congé hebdomadaire, donc le créneau est indisponible
      }

      // Vérifier si l'employé a un jour de congé à la date sélectionnée
      const isDayOff = employeeDaysOff.some((dayOff) => {
        const dayOffDate = new Date(dayOff.day_off_date);
        const isOff =
          dayOff.employee_email === employeeId &&
          dayOffDate.getFullYear() === date.getFullYear() &&
          dayOffDate.getMonth() === date.getMonth() &&
          dayOffDate.getDate() === date.getDate();

        return isOff;
      });

      if (isDayOff) {
        return false; // L'employé a un jour de congé, donc le créneau est indisponible
      }

      // Vérifier si l'employé est disponible pendant la période spécifiée
      const isWithinAvailablePeriod = employeeAvailablePeriods.some(
        (period) => {
          const fromDate = new Date(period.from_date);
          const toDate = new Date(period.to_date);
          const isAvailable =
            period.employee_email === employeeId &&
            date >= fromDate &&
            date <= toDate;

          return isAvailable;
        }
      );

      if (!isWithinAvailablePeriod) {
        return false; // L'employé n'est pas disponible pendant cette période, donc le créneau est indisponible
      }

      // Vérifier si le créneau est déjà réservé à la date et à l'heure spécifiées
      const isUnavailable = unavailableDays.some((unavailable) => {
        const unavailableDate = new Date(unavailable.date);
        const isSameYear = date.getFullYear() === unavailableDate.getFullYear();
        const isSameMonth = date.getMonth() === unavailableDate.getMonth();
        const isSameDay = date.getDate() === unavailableDate.getDate();
        const isSameTime = time === unavailable.time_slot.split(":")[0] + ":00";
        const isSameEmployee = unavailable.employe_email === employeeId;

        const isBooked =
          isSameYear &&
          isSameMonth &&
          isSameDay &&
          isSameTime &&
          isSameEmployee;

        return isBooked;
      });

      if (!isUnavailable) {
        availableEmployees.push(employeeId); // Ajouter l'employé à la liste des disponibles s'il n'est pas indisponible
        return true; // L'employé est disponible
      }

      return false; // L'employé est indisponible pour ce créneau horaire
    });

    return !isAnyEmployeeAvailable; // Si aucun employé n'est disponible pour ce créneau, retourner true
  };

  const handleSubmit = async () => {
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    console.log(
      email,
      service,
      formattedDate,
      selectedTimeSlot,
      name,
      firstName,
      formattedPhoneNumber,
      description
    );
    try {
      await axios.post(
        "https://appointment-fr-12d3.onrender.com/reserve/appointment",
        {
          clientEmail: email,
          service: service,
          date: formattedDate,
          timeSlot: selectedTimeSlot,
          clientName: name,
          clientFirstname: firstName,
          phoneNumber: formattedPhoneNumber,
          description: description,
        }
      );
      const dateObject = new Date(formattedDate);

      // Vérifiez si dateObject est valide
      if (isNaN(dateObject.getTime())) {
        throw new Error("Invalid date");
      }

      const formattedDateString = dateObject.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });

      const message = `Your reservation for ${service} on ${formattedDateString} at ${selectedTimeSlot} has been successfully created.`;

      fetchUnavailableDays();

      // Réinitialiser les états nécessaires après l'ajout du rendez-vous
      setDate(null);
      setSelectedTimeSlot(null);
      setEmail("");
      setFirstName("");
      setName("");
      setPhoneNumber("");
      setDescription("");
      setService("");

      // Afficher un toast de succès
      toast({
        title: message,
        status: "success",
        className: "bg-[#008000]",
      });
    } catch (error) {
      console.error("Error fetching reservation data:", error);
      // Gérer les erreurs de récupération des données de réservation
      toast({
        variant: "destructive",
        description: "The reservation has not been created, Try again !",
      });
    }
  };

  useEffect(() => {
    // Récupérer les informations de l'utilisateur depuis le sessionStorage
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && user.email) {
      setUserEmail(user.email);
      setUserInitials(user.email.slice(0, 2).toUpperCase());
    }
  }, []);

  const handleLogoutClick = () => {
    handleLogout(); // Appeler la fonction handleLogout reçue en prop
    navigate("/");
  };

  // Fonction pour récupérer les informations du client par email
  const fetchClientDetails = async (identifier) => {
    try {
      const response = await axios.get(
        `https://appointment-fr-12d3.onrender.com/reserve/appointment/${identifier}`
      );
      const clientData = response.data[0]; // Assurez-vous que la réponse est un tableau

      if (clientData) {
        setName(clientData.client_name);
        setFirstName(clientData.client_firstname);
        setEmail(clientData.client_email);

        setPhoneNumber(clientData.client_phone);
        // Mettez à jour d'autres champs si nécessaire
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
    }
  };

  // Fonction de gestion du changement de l'identifiant
  const handleIdentifierChange = (event) => {
    const newIdentifier = event.target.value;
    setEmail(newIdentifier);

    // Appeler la fonction fetchClientDetails dès que l'identifiant est saisi
    if (newIdentifier) {
      fetchClientDetails(newIdentifier);
    }
  };

  // Fonction de gestion du changement de l'identifiant
  const handleNameChange = (event) => {
    const newIdentifier = event.target.value;
    setName(newIdentifier);

    // Appeler la fonction fetchClientDetails dès que l'identifiant est saisi
    if (newIdentifier) {
      fetchClientDetails(newIdentifier);
    }
  };
  const menuList = [
    {
      group: "General",
      items: [
        {
          link: "/Dashboard",
          icon: <LayoutDashboard />,
          text: "Appointments",
        },
        {
          link: "/Calender",
          icon: <CalendarCheck />,
          text: "Calender",
        },
        {
          link: "/MyAvailabilities",
          icon: <CalendarCog />,
          text: "My Availabilities",
        },
        {
          link: "/Company",
          icon: <Building2 />,
          text: "Company",
        },

        {
          link: "/Admin",
          icon: <Lock />,
          text: "Admin",
        },
      ],
    },
    {
      group: "Account",
      items: [
        {
          icon: <LogOut />,
          action: handleLogoutClick,
        },
      ],
    },
  ];

  const isDay = useCallback(
    (day) => {
      const dayOfWeek = day.getDay(); // Obtenir le jour de la semaine (0: dimanche, 1: lundi, ..., 6: samedi)
      const daysMap = {
        0: "sunday",
        1: "monday",
        2: "tuesday",
        3: "wednesday",
        4: "thursday",
        5: "friday",
        6: "saturday",
      };

      const dayName = daysMap[dayOfWeek]; // Obtenir le nom du jour
      const isUnavailable = Days[dayName] === false;

      // Vérifiez si la date est dans la plage disponible
      const isInAvailableRange =
        availableDateRange.from && availableDateRange.to
          ? day >= availableDateRange.from && day <= availableDateRange.to
          : true;

      // Vérifier si le jour est marqué comme non disponible dans Days
      return isUnavailable || !isInAvailableRange || day < new Date();
    },
    [Days, availableDateRange]
  );

  const isPastDay = (day) => {
    return day < new Date();
  };

  return (
    <div className="w-[300px] border-r min-h-screen pt-10 sideb">
      <div>
        <div className="flex items-center justify-center gap-2">
          <div className="avatar rounded-full min-h-12 min-w-12 bg-emerald-500 font-[700] flex items-center justify-center text-white">
            <p>{userInitials}</p>
          </div>
          <div className="text-white">
            <p className="text-md">{userEmail}</p>
          </div>
        </div>
        <Command>
          <CommandList>
            {menuList.map((menu, index) => (
              <CommandGroup key={index} heading={menu.group}>
                {menu.items.map((option, optionsKey) =>
                  option.text ? (
                    <Link to={option.link} key={optionsKey}>
                      <CommandItem
                        key={optionsKey}
                        className="flex gap-2 cursor-pointer"
                      >
                        {option.icon}
                        {option.text}
                      </CommandItem>
                    </Link>
                  ) : (
                    <div onClick={handleLogoutClick} key={index}>
                      <CommandItem
                        key={index}
                        className="flex gap-2 cursor-pointer"
                      >
                        {option.icon}
                        <p>Logout</p>
                      </CommandItem>
                    </div>
                  )
                )}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
        <Sheet className="mt-10">
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="text-white mt-5"
              onClick={() => {
                fetchUnavailableDays();
                fetchServices();
                fetchEmployeeDaysoffWeek();
                fetchEmployeeAvailablePeriods();
                fetchEmployeeDaysOff();
                setDate("");
                fetchDays();
              }}
            >
              {" "}
              <Plus /> New Appointment
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>New Appointment</SheetTitle>
            </SheetHeader>
            <div>
              <div className=" grid grid-cols-1 md:grid-cols-2 mt-5 gap-6">
                <div className="flex flex-col gap-3 items-baseline">
                  <div className="flex gap-2 items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
                      />
                    </svg>
                    Select Date
                  </div>
                  <div className="md:block md:w-auto flex w-full justify-center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        setDate(selectedDate);
                      }}
                      disabled={(day) => isPastDay(day) || isDay(day)}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 items-baseline">
                  <div className="flex gap-2 items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    Select Time Slot
                  </div>
                  <div className="grid grid-cols-3 gap-2 border rounded-lg p-5 h-full w-full">
                    {timeSlot?.map((item, index) => (
                      <div
                        onClick={() => {
                          if (!item.isUnavailable)
                            setSelectedTimeSlot(item.time);
                        }}
                        key={index}
                        className={`

                          p-2 cursor-pointer border rounded-lg flex justify-center items-center text-center

                          ${
                            item.isUnavailable
                              ? "bg-red-300 text-gray-600 cursor-not-allowed hover:"
                              : item.time === selectedTimeSlot
                              ? "bg-primary text-white"
                              : ""
                          }
  `}
                      >
                        {item.time}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                <Label htmlFor="name">Email</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="email"
                  value={email}
                  onChange={handleIdentifierChange}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                <Label htmlFor="name">Last name</Label>
                <Input
                  type="name"
                  id="name"
                  placeholder="name"
                  value={name}
                  onChange={handleNameChange}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                <Label htmlFor="name">First name</Label>
                <Input
                  type="firstName"
                  id="firstName"
                  placeholder="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                <Label htmlFor="name">Phone number</Label>

                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  inputProps={{
                    name: "phoneNumber",
                    required: true,
                  }}
                  containerClass="col-span-3"
                  inputClass="w-full"
                />
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                <Label htmlFor="name">Description</Label>
                <Textarea
                  type="description"
                  placeholder="description"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="mt-5 text-left">
                <Select
                  value={service}
                  onValueChange={(value) => setService(value)}
                >
                  <Label htmlFor="service">Service</Label>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Services</SelectLabel>
                      {services.map((serviceItem) => (
                        <SelectItem
                          key={serviceItem.id}
                          value={serviceItem.name}
                        >
                          {serviceItem.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button
                  disabled={
                    !(
                      date &&
                      description &&
                      selectedTimeSlot &&
                      name &&
                      firstName &&
                      phoneNumber &&
                      service
                    )
                  }
                  onClick={handleSubmit}
                >
                  ADD
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Toaster />
      </div>
    </div>
  );
}
Sidebar.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};
