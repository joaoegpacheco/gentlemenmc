"use client";
import React, { useRef, useEffect } from "react";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import allLocales from "@fullcalendar/core/locales-all";

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
  { title: "Bate e Volta São Bento do Sul/SC", date: "2025-06-06" },
  { title: "Bate e Volta São Francisco do Sul/SC", date: "2025-06-22" },
  { title: "Bate e Volta Piraí do Sul/PR - Rota 090", date: "2025-07-06" },
  { title: "Encontro Capital Moto Week - Brasília/DF", date: "2025-07-24" },
  { title: "Encontro Capital Moto Week - Brasília/DF", date: "2025-07-25" },
  { title: "Encontro Capital Moto Week - Brasília/DF", date: "2025-07-26" },
  { title: "Encontro Capital Moto Week - Brasília/DF", date: "2025-07-27" },
  { title: "Encontro Capital Moto Week - Brasília/DF", date: "2025-07-28" },
  { title: "Encontro Capital Moto Week - Brasília/DF", date: "2025-07-29" },
  { title: "Encontro Capital Moto Week - Brasília/DF", date: "2025-07-30" },
  { title: "Encontro Capital Moto Week - Brasília/DF", date: "2025-07-31" },
  { title: "Encontro Harley Club Paraguay - Assuncion/PY", date: "2025-08-13" },
  { title: "Encontro Harley Club Paraguay - Assuncion/PY", date: "2025-08-14" },
  { title: "Encontro Harley Club Paraguay - Assuncion/PY", date: "2025-08-15" },
  { title: "Encontro Harley Club Paraguay - Assuncion/PY", date: "2025-08-16" },
  { title: "Encontro Harley Club Paraguay - Assuncion/PY", date: "2025-08-17" },
  { title: "Parque Malwee - Pomerode/SC", date: "2025-08-30" },
  { title: "Parque Malwee - Pomerode/SC", date: "2025-08-31" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-07" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-08" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-09" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-10" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-11" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-12" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-13" },
  { title: "Churrascaria Costela de Chão - Ponta Grossa/PR", date: "2025-09-14" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-14" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-15" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-16" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-17" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-18" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-19" },
  { title: "Viagem Internacional - Mendonza/AR", date: "2025-09-20" },
  { title: "Bate e Volta - Estrada Bonita/SC", date: "2025-10-04" },
  { title: "Lucky Friends Rodeo - Sorocaba/SP", date: "2025-10-17" },
  { title: "Lucky Friends Rodeo - Sorocaba/SP", date: "2025-10-18" },
  { title: "Lucky Friends Rodeo - Sorocaba/SP", date: "2025-10-19" },
  { title: "Bate e Volta - Campo do Tenente/Lapa/PR", date: "2025-11-02" },
  { title: "Liberty Drag Race - Balneário Camboriú/SC", date: "2025-11-15" },
  { title: "Liberty Drag Race - Balneário Camboriú/SC", date: "2025-11-16" },
  { title: "Encontro Herley Club Paraguay - Ciudad del Este/PY", date: "2025-12-04" },
  { title: "Encontro Herley Club Paraguay - Ciudad del Este/PY", date: "2025-12-05" },
  { title: "Encontro Herley Club Paraguay - Ciudad del Este/PY", date: "2025-12-06" },
  { title: "Encontro Herley Club Paraguay - Ciudad del Este/PY", date: "2025-12-07" },
  { title: "Bate e Volta Surpresa - Encerramento das atividades 2025", date: "2025-12-20" },
  { title: "Festa Pomerana - Pomerode/SC", date: "2026-01-17" },
  { title: "Festa Pomerana - Pomerode/SC", date: "2026-01-18" },
];

const CalendarEvents = () => {
  const calendarRef = useRef(null);

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
  }, []);

  return <div ref={calendarRef}></div>;
};

export default CalendarEvents;
