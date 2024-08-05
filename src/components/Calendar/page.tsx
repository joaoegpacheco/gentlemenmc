"use client";
import React, { useRef, useEffect } from 'react';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarEvents = () => {
  const calendarRef = useRef(null);

  useEffect(() => {
    //@ts-ignore
    const calendar = new Calendar(calendarRef.current, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      events: [
        { title: 'Aniversário Rodrigo N.D', date: '2024-08-04' },
        { title: 'Encontro Gentlemen', date: '2024-08-07' },
        { title: 'Lançamento Loja GTM Store', date: '2024-08-07' }
      ]
    });

    calendar.render();
  }, []);

  return (
    <div ref={calendarRef}></div>
  );
};

export default CalendarEvents;
