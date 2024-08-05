"use client";
import React, { useRef, useEffect } from "react";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import allLocales from "@fullcalendar/core/locales-all";

const CalendarEvents = () => {
  const calendarRef = useRef(null);

  useEffect(() => {
    //@ts-ignore
    const calendar = new Calendar(calendarRef.current, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: "dayGridMonth",
      events: [
        { title: "Aniversário Rodrigo N.D", date: "2024-08-04" },
        { title: "Encontro Gentlemen", date: "2024-08-07" },
        { title: "Lançamento Loja GTM Custom", date: "2024-08-07" },
        { title: "Encontro Gentlemen", date: "2024-08-14" },
        { title: "Encontro Gentlemen", date: "2024-08-21" },
        { title: "Encontro Gentlemen", date: "2024-08-28" },
      ],
      eventClick: function(info) {
        var eventObj = info.event;
  
        if (eventObj.url) {
          alert(
            'Clicked ' + eventObj.title + '.\n' +
            'Will open ' + eventObj.url + ' in a new tab'
          );
  
          window.open(eventObj.url);
  
          info.jsEvent.preventDefault(); // prevents browser from following link in current tab.
        } else {
          alert(eventObj.title);
        }
      },
      ignoreTimezone: false,
      buttonText: {
        prev: "ant.",
        next: "prox.",
        prevYear: "ant.",
        nextYear: "próx.",
        today: "Hoje",
        month: "Mês",
        week: "Semana",
        day: "Dia",
      },
      locales: allLocales,
      locale: "pt-br",
      headerToolbar: {
        left: "prev,next",
        center: "title",
        right: false,
      },
    });

    calendar.render();
  }, []);

  return <div ref={calendarRef}></div>;
};

export default CalendarEvents;
