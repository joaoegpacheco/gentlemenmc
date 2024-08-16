"use client";
import React, { useEffect } from 'react';
import { Tabs, Typography } from 'antd';
import type { TabsProps } from 'antd';
import { FormComand } from "@/components/Form/page";
import { CardComand } from "@/components/Card/page";
import { ChangePasswordForm } from "@/components/ChangePasswordForm/page";
import { LogoutButton } from "@/components/LogoutButton/page";
import { createClient } from "@supabase/supabase-js";
import dayjs from 'dayjs';
import CalendarEvents from '../Calendar/page';

const { Text } = Typography;

const supabase = createClient(
  "https://cuqvbjobsgfbfahjrzeq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXZiam9ic2dmYmZhaGpyemVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg5ODgxOTQsImV4cCI6MjAzNDU2NDE5NH0.4TzTzyJZSAnZckDTCEQrVYg6MLmpyHkg1VvI-gipXAU"
);

const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'Marcar',
        children: <FormComand />,
      },
      {
        key: '2',
        label: 'Ver marcações',
        children: <CardComand />,
      },
      {
        key: '3',
        label: 'Eventos',
        children: <CalendarEvents />,
        // children: 'Em construção!',
      },
      {
        key: '4',
        label: 'Estatuto',
        // children: <CalendarEvents />,
        children: 'Em construção!',
      },
      {
        key: '5',
        label: 'Alterar senha',
        children: <ChangePasswordForm />,
      },
      {
        key: '6',
        label: <LogoutButton />
      }
];

export default function TabsComponent() { 

  useEffect(() => {
    const checkIfUserIsLoggedIn = async () => {
      const session = supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser()

      if (!session || !user) {
        // Se o usuário não estiver logado, redirecione para a página principal
        window.location.href = "/";
      }
    };

    checkIfUserIsLoggedIn();
  }, []);

  const aniversariantes = [
    { name: "Alex", fullDate: "1974-08-12", day: "12" },
    { name: "André", fullDate: "1985-05-13", day: "13" },
    { name: "Athayde", fullDate: "1979-01-24", day: "24" },
    { name: "Bacellar", fullDate: "1962-09-05", day: "05" },
    { name: "Beto", fullDate: "1962-09-07", day: "07" },
    { name: "Claudio", fullDate: "1971-10-08", day: "08" },
    { name: "Fernando", fullDate: "1967-11-05", day: "05" },
    { name: "Giuliano", fullDate: "1989-03-28", day: "28" },
    { name: "Gulitich", fullDate: "1973-02-19", day: "19" },
    { name: "Índio", fullDate: "1970-06-25", day: "25" },
    { name: "Jeferson", fullDate: "1974-10-05", day: "05" },
    { name: "João Marius", fullDate: "1972-08-02", day: "02" },
    { name: "Madalosso", fullDate: "1988-02-20", day: "20" },
    { name: "Maicon", fullDate: "1983-02-16", day: "16" },
    { name: "Mega", fullDate: "1979-07-31", day: "31" },
    { name: "Mortari", fullDate: "1970-01-18", day: "18" },
    { name: "Pacheco", fullDate: "1990-03-04", day: "04" },
    { name: "Rafael", fullDate: "1975-08-09", day: "09" },
    { name: "Soares", fullDate: "1991-06-19", day: "19" },
    { name: "Rodrigo ND", fullDate: "1976-08-04", day: "04" },
    { name: "Rogério", fullDate: "1971-11-03", day: "03" },
    { name: "Weriton", fullDate: "1976-04-24", day: "24" },
    { name: "Zanona", fullDate: "1985-01-02", day: "02" },
    { name: "Zé Carlos", fullDate: "1967-12-08", day: "08" },
    { name: "Zeca", fullDate: "1970-03-05", day: "05" },
    { name: "Zorek", fullDate: "1987-10-02", day: "02" },
    { name: "Robson", fullDate: "1987-07-18", day: "18" },
    { name: "Jefão", fullDate: "1981-02-04", day: "04" },
    { name: "Léo", fullDate: "1981-11-22", day: "22" },
    { name: "Valdinei", fullDate: "1977-08-06", day: "06" },
  ];

  const birthdaysOfTheMonth = aniversariantes.filter(birthday => {
    const dateCurrent = new Date();
    const fullDate = dayjs(birthday.fullDate);
    return fullDate.month() === dateCurrent.getMonth();
  }).sort((a, b) => {
    const dateA = a.day;
    const dateB = b.day;
    return Number(dateA) - Number(dateB); 
  });

  const birthdaysString = birthdaysOfTheMonth.map((birthday: any) => `${birthday.name} (${birthday.day})`).join(', ');

  return ( 
    <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
      <div style={{paddingLeft: 20}}>
      <p style={{fontSize: 14}}>Aniversariantes do mês: </p>
      <Text style={{fontSize: 14}} strong>{birthdaysString}</Text>
      </div>
      <Tabs style={{width: "100%", padding: '0 20px 0'}} defaultActiveKey="1" items={items} />
    </div>
  )
};