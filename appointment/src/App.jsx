import "./App.css";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { loadStripe } from "@stripe/stripe-js";
import { Textarea } from "@/components/ui/textarea";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const stripePromise = loadStripe("pk_live_vzCRUbkde5AIW9Jf00WjY3yf");

const stripe = await stripePromise;

function App() {
  const { toast } = useToast();
  const [reservationCompleted, setReservationCompleted] = useState(true);
  const [employeeIds, setEmployeeIds] = useState([]);
  const [Days, setDays] = useState([]);
  const [availableDateRange, setAvailableDateRange] = useState({
    from: null,
    to: null,
  });
  const [employeeDaysOff, setEmployeeDaysOff] = useState([]);
  const [employeeDaysOffWeek, setEmployeeDaysOffWeek] = useState([]);
  const [employeeAvailablePeriods, setEmployeeAvailablePeriods] = useState([]);

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
      console.log(availablePeriodsData);

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

  useEffect(() => {
    fetchUnavailableDays();
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
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    const fetchReservationData = async () => {
      if (window.location.href.includes("success")) {
        try {
          const response = await axios.get(
            `https://appointment-fr-12d3.onrender.com/success?session_id=${sessionId}`
          );
          const reservationData = response.data.reservation;

          // Formatage de la date pour affichage
          const formattedDate = new Date(reservationData.date);
          const formattedDateString = formattedDate.toLocaleDateString(
            "fr-FR",
            {
              month: "long",
              day: "numeric",
            }
          );

          const message = `Votre réservation pour ${reservationData.service} le ${formattedDateString} à ${reservationData.timeSlot} a été planifiée. Un mail de confirmation vous a été envoyé.`;

          console.log("Reservation Data:", reservationData);

          const reservationCompleted =
            sessionStorage.getItem("reservationCompleted") === "true";

          if (!reservationCompleted) {
            // Soumettre la réservation au backend
            await axios.post(
              "https://appointment-fr-12d3.onrender.com/reserve",
              reservationData
            );
            // Mettre à jour reservationCompleted dans sessionStorage
            sessionStorage.setItem("reservationCompleted", true);

            toast({
              title: "Paiement réussi",
              description: message,
              status: "success",
              className: "bg-[#e4d7cc]",
            });

            sessionStorage.setItem("reservationCompleted", true);
          }

          // Mettre à jour les jours non disponibles
          fetchUnavailableDays();

          sessionStorage.setItem("reservationCompleted", "true");

          // Mettre à jour l'état local pour éviter les soumissions multiples
          setReservationCompleted(true);
        } catch (error) {
          console.error("Error fetching reservation data:", error);
          // Gérer les erreurs de récupération des données de réservation
        }
      }
    };

    const timer = setTimeout(fetchReservationData, 500); // Ajustez la durée du délai en millisecondes selon vos besoins

    return () => clearTimeout(timer);
  }, [toast, reservationCompleted]);

  useEffect(() => {
    const handleButtonClick = () => {
      const myAlertDialogTrigger = document.getElementById(
        "myAlertDialogTrigger"
      );
      if (myAlertDialogTrigger) {
        myAlertDialogTrigger.click();
      }
    };

    const button = document.getElementById("myButton");
    if (button) {
      button.addEventListener("click", handleButtonClick);
    }

    return () => {
      if (button) {
        button.removeEventListener("click", handleButtonClick);
      }
    };
  }, []);

  const [services, setServices] = useState([]);
  const [date, setDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState();
  const [unavailableDays, setUnavailableDays] = useState([]);

  useEffect(() => {
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [firstName, setFirstName] = useState("");
  const [service, setService] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const formatPhoneNumber = (number) => {
    if (!number.startsWith("+")) {
      return "+" + number;
    }
    return number;
  };

  const handleSubmit = async () => {
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    sessionStorage.setItem("reservationCompleted", false);

    try {
      const sessionResponse = await axios.post(
        "https://appointment-fr-12d3.onrender.com/create-checkout-session",
        {
          reservationData: {
            service: service,
            description: description,
            date: formattedDate,
            timeSlot: selectedTimeSlot,
            clientName: name,
            clientFirstname: firstName,
            phoneNumber: formattedPhoneNumber,
          },
          amount: 3000, // Montant à payer en cents
          currency: "eur", // Devise
        }
      );

      const result = await stripe.redirectToCheckout({
        sessionId: sessionResponse.data.id,
      });

      if (result.error) {
        console.error("Erreur de redirection vers Checkout:", result.error);

        // Gérer l'erreur de redirection
      }
    } catch (error) {
      console.error("Error:", error);
      // Gérer les erreurs en cas de problème avec la requête POST
    }
  };

  return (
    <div className="App">
      <Toaster />
      <AlertDialog className="z-100">
        <AlertDialogTrigger id="myAlertDialogTrigger" />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="text-center">Réservation</div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 mt-5 gap-6">
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
                      Sélectionnez la date
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
                      Sélectionnez le créneau horaire
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
                <div className="flex flex-col">
                  <div className="md:flex justify-between">
                    <div className="mt-5 text-left">
                      <Select
                        value={service}
                        onValueChange={(value) => setService(value)}
                      >
                        <Label htmlFor="service">Service</Label>
                        <SelectTrigger className="w-[180px]">
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
                    <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                      <Label htmlFor="name">Prénom </Label>
                      <Input
                        type="firstName"
                        id="firstName"
                        placeholder="Prénom"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-between   ">
                    <div className="flex flex-col-reverse md:flex-row  justify-between md:gap-5">
                      {" "}
                      <div className="mt-5 max-w-sm text-left">
                        <Label htmlFor="name">Numéro de téléphone </Label>
                        <PhoneInput
                          inputProps={{
                            name: "phone",
                            required: true,
                            autoFocus: true,
                          }}
                          onChange={(value) => setPhoneNumber(value)}
                        />
                      </div>
                      <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                          type="name"
                          id="name"
                          placeholder="Nom"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                      <Label htmlFor="message">Note</Label>
                      <Textarea
                        placeholder="Note ..."
                        id="message"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel>Fermez</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                !(
                  date &&
                  selectedTimeSlot &&
                  name &&
                  firstName &&
                  phoneNumber &&
                  service
                )
              }
              onClick={handleSubmit}
            >
              Continuer !
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
