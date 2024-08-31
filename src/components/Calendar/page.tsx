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
        { title: "Entrega de donativos na Vila Torres", date: "2024-08-10" },
        { title: "Aniversário do Presidente", date: "2024-08-10" },
        { title: "Encontro Gentlemen", date: "2024-08-14" },
        { title: "Targo Clube de Tiro", date: "2024-08-15" },
        { title: "Passeio PMPR 170 anos", date: "2024-08-17" },
        { title: "Encontro Gentlemen - Tainha do VP", date: "2024-08-21" },
        { title: "Ida Viagem Ilha do Mel", date: "2024-08-24" },
        { title: "Volta Viagem Ilha do Mel", date: "2024-08-25" },
        { title: "Encontro Gentlemen - Noite Árabe com as mulheres", date: "2024-08-28" },
        { title: "Encontro Gentlemen - Jack Burguer do João Marius", date: "2024-09-04" },
        { title: "Desfile 7 de Setembro", date: "2024-09-07" },
        { title: "Encontro Gentlemen - Mocotó do Cláudio", date: "2024-09-11" },
        { title: "Encontro Gentlemen - Pizza do Rogério com as mulheres", date: "2024-09-18" },
        { title: "Projeto Nova Terra", date: "2024-09-25" },
        { title: "Ida Viagem do Atacama", date: "2024-09-27" },
        { title: "Sede Fechada", date: "2024-10-04" },
        { title: "Volta Viagem do Atacama", date: "2024-10-12" },
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
