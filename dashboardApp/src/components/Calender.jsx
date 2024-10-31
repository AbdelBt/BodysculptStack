import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {
  Phone,
  Mail,
  CalendarCheck2,
  CircleUser,
  HandPlatter,
  Info,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"; // Assurez-vous d'importer vos composants d'alerte-dialogue personnalisés

export default function Calendar() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const dialogRef = useRef(); // Référence pour AlertDialogTrigger
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      navigate("/");
    } else {
      setIsLoading(false);
      fetchReservations();
    }
  }, [navigate]);

  const fetchReservations = async () => {
    try {
      const response = await fetch(
        "https://appointment-fr-12d3.onrender.com/reserve"
      ); // Assurez-vous que l'URL correspond à votre configuration backend
      const data = await response.json();
      const formattedEvents = data.reservations.map((reservation) => ({
        title: `${reservation.service} - ${reservation.client_firstname}`,
        start: `${reservation.date}T${reservation.time_slot}`,
        time: `${reservation.time_slot}`,
        service: reservation.service,
        description: reservation.description,
        clientName: `${reservation.client_firstname} ${reservation.client_name}`,
        clientEmail: reservation.client_email,
        clientPhone: reservation.client_phone,
        // Combine date and time in 24-hour format
        // Vous pouvez ajuster le format de la date si nécessaire
      }));
      console.log(formattedEvents);
      setEvents(formattedEvents);
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations:", error);
    }
  };

  const handleEventClick = (arg) => {
    // Gérer le clic sur un événement dans le calendrier
    setSelectedEvent(arg.event); // Enregistrer l'événement sélectionné

    showDialog(); // Afficher le dialogue personnalisé
  };

  const showDialog = () => {
    // Fonction pour afficher le dialogue
    if (dialogRef.current) {
      dialogRef.current.click(); // Déclencher le dialogue via la référence
    }
  };

  if (isLoading) {
    return <div>Loading...</div>; // Ou afficher un spinner ou un message de chargement
  }

  const eventDetails = selectedEvent
    ? {
        title: selectedEvent.title,
        start: selectedEvent.start ? selectedEvent.start.toLocaleString() : "",
        end: selectedEvent.end ? selectedEvent.end.toLocaleString() : "",
        time: selectedEvent.extendedProps.time,
        service: selectedEvent.extendedProps.service,
        clientName: selectedEvent.extendedProps.clientName,
        clientEmail: selectedEvent.extendedProps.clientEmail,
        clientPhone: selectedEvent.extendedProps.clientPhone,
        description: selectedEvent.extendedProps.description,
      }
    : null;
  return (
    <div style={{ width: "100%", height: "98vh" }} className="text-white m-5">
      {/* AlertDialog personnalisé */}
      <AlertDialog>
        <AlertDialogTrigger
          ref={dialogRef}
          style={{ display: "none" }}
        ></AlertDialogTrigger>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black text-2xl  mb-5">
              {eventDetails && <strong>{eventDetails.title}</strong>}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {eventDetails && (
                <>
                  <ul className="list-none pl-0 space-y-3">
                    <li className="flex items-start">
                      <span className="flex font-bold	 text-black min-w-[120px] text-lg">
                        <CalendarCheck2 /> &nbsp; Time:
                      </span>
                      <span className="font-bold text-black text-lg">
                        {eventDetails.time}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex font-bold	 text-black min-w-[120px] text-lg">
                        <HandPlatter /> &nbsp; Service:
                      </span>
                      <span className="font-bold text-black text-lg">
                        {eventDetails.service}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex font-bold	 text-black min-w-[120px] text-lg">
                        <Info /> &nbsp; info:
                      </span>
                      <span className="font-bold text-black text-lg">
                        {eventDetails.description}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex font-bold	 text-black min-w-[120px] text-lg">
                        <CircleUser /> &nbsp; Name:
                      </span>
                      <span className="font-bold text-black text-lg">
                        {eventDetails.clientName}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex font-bold	 text-black min-w-[120px] text-lg">
                        <Mail /> &nbsp; Email:&nbsp;
                      </span>
                      <span className="font-bold text-black text-lg">
                        {eventDetails.clientEmail}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex font-bold	 text-black min-w-[120px] text-lg">
                        <Phone /> &nbsp; Phone:
                      </span>
                      <span className="font-bold text-black text-lg">
                        {eventDetails.clientPhone}
                      </span>
                    </li>
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* FullCalendar */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="listWeek"
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false, // Utiliser le format 24 heures
          meridiem: false,
        }}
        headerToolbar={{
          start: "today prev,next",
          center: "title",
          end: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        events={events}
        height="100%"
        selectable={true} // Permet la sélection de plage de dates
        eventClick={handleEventClick} // Gérer le clic sur un événement
      />
    </div>
  );
}
