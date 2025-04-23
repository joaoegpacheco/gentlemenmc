"use client";
import React, { useEffect, useState } from "react";
import { Tabs, Typography } from "antd";
import type { TabsProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/hooks/use-supabase";
import { PostgrestResponse } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { LogoutButton } from "../LogoutButton/page";

interface AdminData {
  id: string;
}

interface Birthday {
  name: string;
  fullDate: string;
  day: string;
}

const { Text } = Typography;

const items: TabsProps["items"] = [
  { key: "/protected/comandas", label: "Marcar" },
  { key: "/protected/ver-comandas", label: "Ver marcações" },
  { key: "/protected/rachides", label: "Rachide comidas" },
  { key: "/protected/ver-rachides", label: "Ver Rachides" },
  { key: "/protected/eventos", label: "Eventos" },
  { key: "/protected/estatuto", label: "Estatuto" },
  { key: "/protected/alterar-senha", label: "Alterar senha" },
  { key: "/logout", label: <LogoutButton /> },
];

const itemsAdmin: TabsProps["items"] = [
  ...items.slice(0, 7),
  { key: "/protected/atualizar-pago-bebidas", label: "Atualizar Pago Bebidas" },
  { key: "/protected/dividas-todos", label: "Dívidas todos" },
  { key: "/logout", label: <LogoutButton /> },
];

export default function TabsComponent() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkIfUserIsAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        window.location.href = "/";
        return;
      }

      try {
        const { data: admins }: PostgrestResponse<AdminData> = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id);

        setAdmin(!!admins?.length);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setAdmin(false);
      }
    };

    checkIfUserIsAdmin();
  }, []);

  const birthdays: Birthday[] = [
    { name: "Alex", fullDate: "1974-08-12", day: "12" },
    { name: "André", fullDate: "1985-09-12", day: "12" },
    { name: "Athayde", fullDate: "1979-01-24", day: "24" },
    { name: "Bacellar", fullDate: "1962-09-05", day: "05" },
    { name: "Baeza", fullDate: "1977-01-09", day: "09" },
    { name: "Beto", fullDate: "1962-09-07", day: "07" },
    { name: "Claudio", fullDate: "1971-10-08", day: "08" },
    { name: "Camargo", fullDate: "1971-06-11", day: "11" },
    { name: "Fernando", fullDate: "1967-11-05", day: "05" },
    { name: "Giuliano", fullDate: "1989-03-28", day: "28" },
    { name: "Gulitich", fullDate: "1973-02-19", day: "19" },
    { name: "Índio", fullDate: "1970-06-25", day: "25" },
    { name: "Jefão", fullDate: "1981-02-04", day: "04" },
    { name: "Jeferson", fullDate: "1974-10-05", day: "05" },
    { name: "João Marius", fullDate: "1972-08-02", day: "02" },
    { name: "Léo", fullDate: "1981-09-27", day: "27" },
    { name: "Luiz", fullDate: "1981-09-27", day: "27" },
    { name: "Madalosso", fullDate: "1988-02-20", day: "20" },
    { name: "Maicon", fullDate: "1983-02-16", day: "16" },
    { name: "Mega", fullDate: "1979-07-31", day: "31" },
    { name: "Mortari", fullDate: "1970-01-18", day: "18" },
    { name: "Muller", fullDate: "1979-08-15", day: "15" },
    { name: "Pacheco", fullDate: "1990-03-04", day: "04" },
    { name: "Rafael", fullDate: "1975-08-09", day: "09" },
    { name: "Robson", fullDate: "1987-07-18", day: "18" },
    { name: "Rodrigo ND", fullDate: "1976-08-04", day: "04" },
    { name: "Rogério", fullDate: "1971-11-03", day: "03" },
    { name: "Soares", fullDate: "1991-06-19", day: "19" },
    { name: "Valdinei", fullDate: "1977-08-06", day: "06" },
    { name: "Weriton", fullDate: "1976-04-24", day: "24" },
    { name: "Zanona", fullDate: "1985-01-02", day: "02" },
    { name: "Zé Carlos", fullDate: "1967-12-08", day: "08" },
    { name: "Zeca", fullDate: "1970-03-05", day: "05" },
    { name: "Zorek", fullDate: "1987-10-02", day: "02" },
  ];

  const birthdaysOfTheMonth = birthdays
    .filter((birthday) => dayjs(birthday.fullDate).month() === new Date().getMonth())
    .sort((a, b) => Number(a.day) - Number(b.day));

  const birthdaysString = birthdaysOfTheMonth
    .map((birthday) => `${birthday.name} (${birthday.day})`)
    .join(", ");

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "0 20px 0" }}>
        <p style={{ fontSize: 14 }}>Aniversariantes do mês: </p>
        <Text style={{ fontSize: 14 }} strong>{birthdaysString}</Text>
      </div>
      <Tabs
        style={{ width: "100%", padding: "0 20px" }}
        defaultActiveKey="1"
        activeKey={pathname}
        onChange={(key) => router.push(key)}
        items={admin ? itemsAdmin : items}
      />
    </div>
  );
}
