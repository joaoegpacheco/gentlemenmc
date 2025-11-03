"use client";
import React, { useRef, useEffect } from "react";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import allLocales from "@fullcalendar/core/locales-all";
import { useTheme } from "next-themes";

const events = [
  { title: "Primeiro Encontro Gentlemen 2025", date: "2025-01-15" },
  { title: "Treinamento Safe Rider - Teórico", date: "2025-02-08" },
  { title: "Open House/Entrega cadeira de rodas da Julia", date: "2025-02-15" },
  { title: "Evento Exonerados", date: "2025-02-22" },
  { title: "Evento Casa China", date: "2025-02-22" },
  { title: "Evento Oficina Souls & Machines", date: "2025-02-22" },
  { title: "Aniversário Gulitich e Vanderleia", date: "2025-02-23" },
  { title: "Treinamento Safe Rider - Prático", date: "2025-03-16" },
  { title: "Encontro Guarapuava/PR", date: "2025-03-29" },
  { title: "Encontro Guarapuava/PR", date: "2025-03-30" },
  { title: "Bate e Volta Costelada do bar do Nando - Apiaí/SP", date: "2025-04-12" },
  { title: "Bate e Volta parque histórico - Carambeí/PR", date: "2025-04-26" },
  { title: "Bate e Volta serra Dona Francisca - Pirabeiraba/SC", date: "2025-05-11" },
  { title: "Serra da Macaca e Rastro da Serpente - Capão Bonito/SP", date: "2025-05-24" },
  { title: "Serra da Macaca e Rastro da Serpente - Capão Bonito/SP", date: "2025-05-25" },
  { title: "2° Festa Junina", date: "2025-06-14" },
  { title: "Arrancada Tramps", date: "2025-08-01" },
  { title: "MotorCycle Fest", date: "2025-08-02" },
  { title: "MotorCycle Fest", date: "2025-08-03" },
  { title: "Quarta na sede", date: "2025-08-06" },
  { title: "Quarta na sede", date: "2025-08-13" },
  { title: "Aniversário Alex e Muller", date: "2025-08-16" },
  { title: "Quarta na sede", date: "2025-08-20" },
  { title: "Quarta na sede", date: "2025-08-27" },
  { title: "Open House - MotoClubes", date: "2025-08-30" },
  { title: "Tradicional desfile 7 de Setembro", date: "2025-09-07" },
  { title: "Rolê de feriado", date: "2025-09-08" },
  { title: "Gentlemen Blue - Sede Gentlemen MC", date: "2025-11-20" },
  { title: "Gentlemen Blue - Sede Gentlemen", date: "2025-11-21" },
  { title: "Gentlemen Blue - Hard Rock Curitiba", date: "2025-11-22" },
  { title: "Votação Presidente Gentlemen MC | 26/27", date: "2025-11-29" },
];

const CalendarEvents = () => {
  const calendarRef = useRef(null);
  const calendarInstanceRef = useRef<Calendar | null>(null);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    if (!calendarRef.current) return;
    
    const calendar = new Calendar(calendarRef.current, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: "dayGridMonth",
      events,
      eventClick: ({ event, jsEvent }) => {
        if (event.url) {
          alert(`Clicked ${event.title}.\nWill open ${event.url} in a new tab`);
          window.open(event.url);
          jsEvent.preventDefault();
        } else {
          alert(event.title);
        }
      },
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
        // left: "prev,next",
        // center: "title",
        right: "prev,next",
      },
    });

    calendar.render();
    calendarInstanceRef.current = calendar;

    return () => {
      calendar.destroy();
    };
  }, []);

  // Re-renderiza o calendário quando o tema muda
  useEffect(() => {
    if (calendarInstanceRef.current && resolvedTheme) {
      // Pequeno delay para garantir que o DOM foi atualizado com as classes dark
      setTimeout(() => {
        calendarInstanceRef.current?.render();
      }, 100);
    }
  }, [resolvedTheme]);

  return <div ref={calendarRef}></div>;
};

export default CalendarEvents;
