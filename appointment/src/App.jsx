import "./App.css";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
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

function App() {
  const { toast } = useToast();
  const [employeeIds, setEmployeeIds] = useState([]);
  const [Days, setDays] = useState([]);
  const [availableDateRange, setAvailableDateRange] = useState({
    from: null,
    to: null,
  });
  const [employeeDaysOff, setEmployeeDaysOff] = useState([]);
  const [employeeDaysOffWeek, setEmployeeDaysOffWeek] = useState([]);
  const [employeeAvailablePeriods, setEmployeeAvailablePeriods] = useState([]);
  const [employeeServicesMap, setEmployeeServicesMap] = useState({});
  const [employeeBreaksMap, setEmployeeBreaksMap] = useState({});
  const [service, setService] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchDays();
  }, []);

  const fetchDays = async () => {
    try {
      const response = await axios.get(
        "https://bodysculptstack.onrender.com/indisponibilities",
      );
      if (response.data.length > 0) {
        // eslint-disable-next-line no-unused-vars
        const { id, ...days } = response.data[0]; // Exclure l'ID
        setDays(days); // Mettre à jour l'état avec les jours non disponibles
        const availableDatesResponse = await axios.get(
          "https://bodysculptstack.onrender.com/available-dates",
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
        "https://bodysculptstack.onrender.com/reserve",
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
        "https://bodysculptstack.onrender.com/employee/days/all",
      );
      const daysOffWeekData = response.data;

      // Filtrer les jours où available est false
      const filteredDaysOffWeek = daysOffWeekData.filter(
        (day) => !day.available,
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
        "https://bodysculptstack.onrender.com/employee/all",
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
    fetchAllEmployeeServices();
    fetchEmployeeBreaks();
  }, []);

  // Récupère la liste complète des services fournis par chaque employé
  const fetchAllEmployeeServices = async () => {
    try {
      const res = await axios.get(
        "https://bodysculptstack.onrender.com/employee/services",
      );
      const rows = Array.isArray(res.data) ? res.data : [];
      const map = {};
      rows.forEach((r) => {
        const email = r.employee_email;
        if (!map[email]) map[email] = new Set();
        const svc = (r.service_name || "")
          .toString()
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        // fallback: if normalized svc is empty, store original
        map[email].add(svc || r.service_name || "");
      });
      setEmployeeServicesMap(map);
    } catch (err) {
      console.error("Error fetching all employee services:", err);
    }
  };

  const fetchEmployeeBreaks = async () => {
    try {
      const res = await axios.get(
        "https://bodysculptstack.onrender.com/employee/breaks/all",
      );
      const rows = Array.isArray(res.data) ? res.data : [];
      const map = {};
      rows.forEach((r) => {
        map[r.employee_email] = { start: r.start_time, end: r.end_time };
      });
      setEmployeeBreaksMap(map);
    } catch (err) {
      console.error("Error fetching employee breaks:", err);
    }
  };

  useEffect(() => {
    fetchUnavailableDays();
  }, []);

  const fetchEmployeeDaysOff = async () => {
    try {
      const response = await axios.get(
        "https://bodysculptstack.onrender.com/employee/days-off/all",
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
    const fetchReservationData = async () => {
      if (window.location.href.includes("success")) {
        const storagePaymentId = localStorage.getItem("molliePaymentId");
        const urlParams = new URLSearchParams(window.location.search);
        const paymentId = urlParams.get("payment_id") || storagePaymentId;

        const lastSessionId = sessionStorage.getItem("lastSessionId");

        if (!paymentId) {
          console.log("Aucun payment_id trouvé");
          return;
        }

        if (lastSessionId === paymentId) {
          console.log("Reservation déjà traitée pour ce payment_id");
          return;
        }

        try {
          const response = await axios.get(
            `https://bodysculptstack.onrender.com/success?payment_id=${paymentId}`,
          );
          const reservationData = response.data.reservation;

          if (!reservationData) {
            console.error(
              "Aucune donnée de réservation retournée par /success",
            );
            return;
          }

          // Formatage de la date pour affichage
          const formattedDate = new Date(reservationData.date);
          const formattedDateString = formattedDate.toLocaleDateString(
            "fr-FR",
            {
              month: "long",
              day: "numeric",
            },
          );

          const message = `Votre réservation pour ${reservationData.service} le ${formattedDateString} à ${reservationData.timeSlot} a été planifiée. Un mail de confirmation vous a été envoyé.`;

          console.log("Reservation Data:", reservationData);

          // Soumettre la réservation au backend
          await axios.post(
            "https://bodysculptstack.onrender.com/reserve",
            reservationData,
          );
          // Mettre à jour reservationCompleted dans sessionStorage
          sessionStorage.setItem("lastSessionId", paymentId);
          toast({
            title: "Paiement réussi",
            description: message,
            status: "success",
            className: "bg-[#e4d7cc]",
          });

          // Mettre à jour les jours non disponibles
          fetchUnavailableDays();
        } catch (error) {
          console.error("Error fetching reservation data:", error);
          // Gérer les erreurs de récupération des données de réservation
        }
      }
    };

    const timer = setTimeout(fetchReservationData, 500); // Ajustez la durée du délai en millisecondes selon vos besoins

    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handleButtonClick = () => {
      const myAlertDialogTrigger = document.getElementById(
        "myAlertDialogTrigger",
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
    const fetchServices = async () => {
      try {
        const response = await axios.get(
          "https://bodysculptstack.onrender.com/services",
        );
        // Normalize names: trim, lowercase and remove diacritics for matching
        const normalized = (response.data || []).map((s) => {
          const original = s.name ? s.name.toString().trim() : "";
          const nameLower = original.toLowerCase();
          const nameNorm = nameLower
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          return { ...s, name: original, nameLower, nameNorm };
        });
        setServices(normalized);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  const getTime = async () => {
    try {
      const [workingHoursRes, specialDaysRes] = await Promise.all([
        axios.get(
          "https://bodysculptstack.onrender.com/available-dates/working-hours",
        ),
        axios.get(
          "https://bodysculptstack.onrender.com/available-dates/special-days",
        ),
      ]);

      const workingHours = workingHoursRes.data;
      const specialDays = specialDaysRes.data;

      if (!date) return;

      const selectedDate = new Date(date);
      const selectedDayName = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const selectedDateFormatted = selectedDate.toISOString().split("T")[0];

      const specialDay = specialDays.find(
        (day) => day.date === selectedDateFormatted,
      );

      const dayHours = workingHours.find(
        (item) => item.day_of_week === selectedDayName,
      );

      // ⏱️ Conversion heures → minutes
      let startHour = 10,
        startMinute = 0,
        endHour = 22,
        endMinute = 0;

      if (dayHours) {
        [startHour, startMinute] = dayHours.start_hour.split(":").map(Number);
        [endHour, endMinute] = dayHours.end_hour.split(":").map(Number);
      }

      if (specialDay) {
        [startHour, startMinute] = specialDay.opening_hour
          .split(":")
          .map(Number);
        [endHour, endMinute] = specialDay.closing_hour.split(":").map(Number);
      }

      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;

      const timeList = [];
      let currentTotalMinutes = startTotalMinutes;
      const step = getServiceDuration(service) || 90; // minutes (60 for kshape)

      while (currentTotalMinutes <= endTotalMinutes) {
        const currentHour = Math.floor(currentTotalMinutes / 60);
        const currentMinute = currentTotalMinutes % 60;

        const time = `${currentHour.toString().padStart(2, "0")}:${currentMinute
          .toString()
          .padStart(2, "0")}`;

        const isUnavailable = isTimeUnavailableForDate(
          time,
          selectedDate,
          service,
        );

        timeList.push({ time, isUnavailable });

        currentTotalMinutes += step;
      }

      setTimeSlot(timeList);
    } catch (error) {
      console.error("Erreur lors de la récupération des horaires :", error);
    }
  };

  useEffect(() => {
    if (date) {
      getTime(date);
      if (isTimeUnavailableForDate(selectedTimeSlot, date, service)) {
        setSelectedTimeSlot(null);
      }
    }
  }, [date, unavailableDays, selectedTimeSlot, service]);

  const isTimeUnavailableForDate = (time, date, serviceName) => {
    if (!time || !date) return false;

    if (
      !Array.isArray(employeeDaysOff) ||
      !Array.isArray(employeeDaysOffWeek) ||
      !Array.isArray(employeeAvailablePeriods)
    ) {
      console.error(
        "Les données des jours de congé des employés ne sont pas un tableau",
      );
      return false;
    }

    const duration = getServiceDuration(serviceName);
    const availableEmployees = [];

    const isAnyEmployeeAvailable = employeeIds.some((employeeId) => {
      // Si un service est demandé, ignorer les employés qui ne le fournissent pas
      if (serviceName) {
        const svcSet = employeeServicesMap[employeeId];
        if (!svcSet) return false;
        const serviceNorm = (serviceName || service || "")
          .toString()
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        // allow match against normalized stored names or original name as fallback
        if (!svcSet.has(serviceNorm) && !svcSet.has(serviceName)) return false;
      }
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
        return false;
      }

      const isDayOff = employeeDaysOff.some((dayOff) => {
        const dayOffDate = new Date(dayOff.day_off_date);
        const isOff =
          dayOff.employee_email === employeeId &&
          dayOffDate.getFullYear() === date.getFullYear() &&
          dayOffDate.getMonth() === date.getMonth() &&
          dayOffDate.getDate() === date.getDate();

        return isOff;
      });

      if (isDayOff) return false;

      const isWithinAvailablePeriod = employeeAvailablePeriods.some(
        (period) => {
          const fromDate = new Date(period.from_date);
          const toDate = new Date(period.to_date);
          return (
            period.employee_email === employeeId &&
            date >= fromDate &&
            date <= toDate
          );
        },
      );

      if (!isWithinAvailablePeriod) return false;

      const targetStart = (() => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      })();
      const targetEnd = targetStart + duration;

      // If this employee has a configured break, apply it; otherwise no break
      const b = employeeBreaksMap[employeeId];
      if (b && b.start && b.end) {
        const [sh, sm] = b.start.split(":").map(Number);
        const [eh, em] = b.end.split(":").map(Number);
        const bStart = (sh || 0) * 60 + (sm || 0);
        const bEnd = (eh || 0) * 60 + (em || 0);
        if (targetStart < bEnd && bStart < targetEnd) {
          return false; // this employee is not available for this slot
        }
      }

      const isUnavailable = unavailableDays.some((unavailable) => {
        const unavailableDate = new Date(unavailable.date);
        const isSameYear = date.getFullYear() === unavailableDate.getFullYear();
        const isSameMonth = date.getMonth() === unavailableDate.getMonth();
        const isSameDay = date.getDate() === unavailableDate.getDate();
        const unavailableTime = unavailable.time_slot.slice(0, 5);
        const [uh, um] = unavailableTime.split(":").map(Number);
        const unavailableStart = uh * 60 + um;
        const existingDuration = getServiceDuration(
          unavailable.service ||
            unavailable.service_name ||
            unavailable.serviceName ||
            "",
        );
        const unavailableEnd = unavailableStart + existingDuration;
        const isSameEmployee = unavailable.employe_email === employeeId;

        const overlaps =
          isSameYear &&
          isSameMonth &&
          isSameDay &&
          isSameEmployee &&
          targetStart < unavailableEnd &&
          unavailableStart < targetEnd;

        return overlaps;
      });

      if (!isUnavailable) {
        availableEmployees.push(employeeId);
        return true;
      }

      return false;
    });

    return !isAnyEmployeeAvailable;
  };

  const [workingHours, setWorkingHours] = useState([]);
  const [specialDays, setSpecialDays] = useState([]);

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const [workingHoursRes, specialDaysRes] = await Promise.all([
          axios.get(
            "https://bodysculptstack.onrender.com/available-dates/working-hours",
          ),
          axios.get(
            "https://bodysculptstack.onrender.com/available-dates/special-days",
          ),
        ]);
        setWorkingHours(workingHoursRes.data);
        setSpecialDays(specialDaysRes.data);
      } catch (error) {
        console.error("Erreur récupération horaires:", error);
      }
    };
    fetchHours();
  }, []);

  const isDay = useCallback(
    (day) => {
      const dayOfWeek = day.getDay();
      const daysMap = {
        0: "sunday",
        1: "monday",
        2: "tuesday",
        3: "wednesday",
        4: "thursday",
        5: "friday",
        6: "saturday",
      };
      const dayName = daysMap[dayOfWeek];

      if (day < new Date()) return true;
      if (Days[dayName] === false) return true;

      const isInAvailableRange =
        availableDateRange.from && availableDateRange.to
          ? day >= availableDateRange.from && day <= availableDateRange.to
          : true;
      if (!isInAvailableRange) return true;

      let startHour = 10,
        startMinute = 0,
        endHour = 22,
        endMinute = 0;

      const selectedDayName = day.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const selectedDateFormatted = day.toISOString().split("T")[0];

      const specialDay = specialDays.find(
        (d) => d.date === selectedDateFormatted,
      );
      const dayHours = workingHours.find(
        (d) => d.day_of_week === selectedDayName,
      );

      if (dayHours) {
        [startHour, startMinute] = dayHours.start_hour.split(":").map(Number);
        [endHour, endMinute] = dayHours.end_hour.split(":").map(Number);
      }

      if (specialDay) {
        [startHour, startMinute] = specialDay.opening_hour
          .split(":")
          .map(Number);
        [endHour, endMinute] = specialDay.closing_hour.split(":").map(Number);
      }

      // 🔹 Générer les créneaux pour ce jour
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      let currentTotalMinutes = startTotalMinutes;
      const timeList = [];

      const step = getServiceDuration(service);

      while (currentTotalMinutes <= endTotalMinutes) {
        const currentHour = Math.floor(currentTotalMinutes / 60);
        const currentMinute = currentTotalMinutes % 60;
        const time = `${currentHour.toString().padStart(2, "0")}:${currentMinute
          .toString()
          .padStart(2, "0")}`;

        const isUnavailable = isTimeUnavailableForDate(time, day, service);

        timeList.push({ time, isUnavailable });
        currentTotalMinutes += step;
      }

      return timeList.every((slot) => slot.isUnavailable);
    },
    [
      Days,
      availableDateRange,
      employeeIds,
      employeeDaysOff,
      unavailableDays,
      employeeDaysOffWeek,
      employeeAvailablePeriods,
      workingHours,
      specialDays,
      isTimeUnavailableForDate,
      getServiceDuration,
      service,
    ],
  );

  const isPastDay = (day) => {
    return day < new Date();
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isServiceAutoSelected, setIsServiceAutoSelected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const normalizeStr = (s) =>
    (s || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  function getServiceDuration(serviceName) {
    if (!serviceName && !service) return 90; // default 90min when no service selected
    const nameNorm = normalizeStr(serviceName || service || "");
    const sixtyTokens = ["kshape"];

    return sixtyTokens.some((t) => nameNorm.includes(normalizeStr(t)))
      ? 60
      : 90;
  }

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

    try {
      const sessionResponse = await axios.post(
        "https://bodysculptstack.onrender.com/create-checkout-session",
        {
          reservationData: {
            service: service,
            description: description,
            date: formattedDate,
            timeSlot: selectedTimeSlot,
            clientName: name,
            clientFirstname: firstName,
            clientEmail: email,
            phoneNumber: formattedPhoneNumber,
          },
          amount: 30,
          currency: "EUR",
        },
      );

      const { paymentUrl, id } = sessionResponse.data;
      if (id) localStorage.setItem("molliePaymentId", id);
      if (paymentUrl) {
        // Redirect to Mollie hosted checkout
        window.location.href = paymentUrl;
      } else {
        console.error("No checkout URL returned from server");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
    }
  };

  useEffect(() => {
    if (!services || services.length === 0) return;

    const mappingKeywords = {
      "eye.html": ["eye", "eyes", "booster", "booter"],
      "vergeture.html": ["vergeture", "vergetures"],
      "dissolution.html": ["dissolution", "dissolution de graisse", "graisse"],
      "Cellulame.html": [
        "cellulame",
        "cellulame fibrose",
        "cellulame fibrose ",
      ],
      "cutané.html": ["relachement", "relâchement", "cutane", "cutané"],
      "kshape.html": ["kshape"],
      "mesocellule.html": ["mesocellule", "messo", "messo cellulite", "meso"],
      "sbio.html": ["sbio", "whitening"],
    };

    // lowercase + normalize mapping keys & keywords (remove diacritics)
    const normalize = (s) =>
      (s || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const mappingLowerNorm = Object.fromEntries(
      Object.entries(mappingKeywords).map(([k, v]) => [
        normalize(k),
        (v || []).map(normalize),
      ]),
    );

    const pickFilename = (path) => {
      if (!path) return "";
      return path.split("/").pop();
    };

    let filename = pickFilename(window.location.pathname);
    if (!filename && document.referrer) {
      try {
        const ref = new URL(document.referrer);
        filename = pickFilename(ref.pathname);
      } catch (e) {
        // ignore
      }
    }

    if (!filename) {
      setService("");
      setIsServiceAutoSelected(false);
      return;
    }

    const filenameDecoded = (() => {
      try {
        return decodeURIComponent(filename);
      } catch (e) {
        return filename;
      }
    })();

    const filenameNorm = normalize(filenameDecoded);

    let matchedService = "";

    if (mappingLowerNorm[filenameNorm]) {
      const keywords = mappingLowerNorm[filenameNorm];
      matchedService = services.find((svc) => {
        const svcNameNorm = svc.nameNorm || normalize(svc.name);
        const isMatch = keywords.some((k) => svcNameNorm.includes(k));

        return isMatch;
      })?.name;
    }

    // fallback: try to match by filename token inside service name (ignore case & accents)
    if (!matchedService) {
      const token = filenameDecoded.split(".")[0] || "";
      const tokenNorm = normalize(token);
      matchedService = services.find((svc) => {
        const svcNameNorm = svc.nameNorm || normalize(svc.name);
        const contains = svcNameNorm.includes(tokenNorm);

        return contains;
      })?.name;
    }

    if (matchedService) {
      setService(matchedService);
      setIsServiceAutoSelected(true);
    } else {
      setService("");
      setIsServiceAutoSelected(false);
    }
  }, [services]);

  useEffect(() => {
    if (!services || services.length === 0) return;

    const sixtyTokens = ["kshape"];

    const sixtyList = services
      .filter((s) => {
        const nameNorm = normalizeStr(s.name || "");
        return sixtyTokens.some((t) => nameNorm.includes(normalizeStr(t)));
      })
      .map((s) => s.name);

    services.filter((s) => !sixtyList.includes(s.name)).map((s) => s.name);
  }, [services]);

  useEffect(() => {
    if (!service) return;
    const nameNorm = normalizeStr(service || "");
    const sixtyTokens = ["kshape"];
    sixtyTokens.some((t) => nameNorm.includes(normalizeStr(t))) ? 60 : 90;
  }, [service]);

  return (
    <div className="App">
      <Toaster />
      <AlertDialog open={isOpen} onOpenChange={setIsOpen} className="z-100">
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
                      <Label htmlFor="service">Service</Label>
                      {isServiceAutoSelected ? (
                        <Input
                          id="service"
                          value={service}
                          readOnly
                          placeholder="Service (sélection automatique selon la page)"
                        />
                      ) : (
                        <Select
                          value={service}
                          onValueChange={(value) => setService(value)}
                        >
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
                      )}
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
                    <div className="flex items-start justify-between flex-col-reverse md:flex-row">
                      <div className="grid items-center gap-1.5 mt-5 text-left">
                        <Label htmlFor="message">Note</Label>
                        <Textarea
                          placeholder="Note ..."
                          id="message"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          type="email"
                          id="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
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
                  service &&
                  email
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
