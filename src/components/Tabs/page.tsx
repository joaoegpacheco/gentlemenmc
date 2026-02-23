"use client";
import React, { useEffect, useRef } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormCommand } from "@/components/Form/page";
import { CardCommand } from "@/components/CardDrinks/page";
import { CardCommandAll } from "@/components/CardDrinksAll/page";
// import { InvoiceForm } from "@/components/InvoiceForm/page";
// import { InvoiceTable } from "@/components/InvoiceTable/page";
// import { ChangePasswordForm } from "@/components/ChangePasswordForm/page";
import { LogoutButton } from "@/components/LogoutButton/page";
import dayjs from "dayjs";
import CalendarEvents from "../Calendar/page";
import ByLaw from "../ByLaw/page";
import { FormMonthlyFee } from "../FormMonthlyFee/page";
import { supabase } from "@/hooks/use-supabase";
import { PostgrestResponse } from "@supabase/supabase-js";
import CreateComandaPage from "@/app/[locale]/nova-comanda/page";
import { OpenComandasPageContent } from "@/components/OpenComandasPageContent/page";
import { PaidComandasPageContent } from "@/components/PaidComandasPageContent/page";
import EstoquePage from "@/app/[locale]/admin/estoque/page";
import HistoricoEstoquePage from "@/app/[locale]/admin/estoque/historico/page";
// import { CreditManager } from "../CreditManager/page";
import MembrosPage from "@/app/[locale]/admin/membros/page";
import { UserProfileTab } from "../UserProfileTab/page";
import { DashboardTab } from "../Dashboard/DashboardTab";
import { ProspectsPage } from "../ProspectsPage/page";
import ProspectValidationPage from "@/app/[locale]/admin/prospectos/validacao/page";

interface AdminData {
  id: string;
}

interface Birthday {
  name: string;
  fullDate: string;
  day: string;
}

export default function TabsComponent() {
  const t = useTranslations('tabs');
  const admin$ = useObservable<boolean | null>(null);
  const manager$ = useObservable<boolean | null>(null);
  const isBarUser$ = useObservable<boolean>(false);
  const caseType$ = useObservable<string | null>(null);
  const activeTab$ = useObservable("1");
  
  const admin = useValue(admin$);
  const manager = useValue(manager$);
  const isBarUser = useValue(isBarUser$);
  const caseType = useValue(caseType$);
  const activeTab = useValue(activeTab$);
  
  const cardComandRef = useRef<any>(null);
  const comandAllTableRef = useRef<any>(null);
  const comandOpenTableRef = useRef<any>(null);
  const paidComandasTableRef = useRef<any>(null);

  useEffect(() => {
    const checkIfUserIsAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        window.location.href = "/";
        return;
      }

      isBarUser$.set(user.email === "barmc@gentlemenmc.com.br");
      manager$.set(user.email === "robson@gentlemenmc.com.br");

      try {
        const { data: admins }: PostgrestResponse<AdminData> = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .eq("role", "admin");

        admin$.set(!!admins?.length);

        // Buscar case_type do membro
        const { data: memberData } = await supabase
          .from("membros")
          .select("case_type")
          .eq("user_id", user.id)
          .single();

        if (memberData?.case_type) {
          caseType$.set(memberData.case_type);
        } else {
          caseType$.set(null);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        admin$.set(false);
        caseType$.set(null);
      }
    };

    checkIfUserIsAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (key: string) => {
    activeTab$.set(key);
    if (key === "2") cardComandRef.current?.refreshData();
    if (key === "10") comandAllTableRef.current?.refreshData();
    if (key === "13") comandOpenTableRef.current?.refreshData();
    if (key === "17") paidComandasTableRef.current?.refreshData();
  };

  const getCurrentTabs = () => {
    // Verificar se o usuário pode ver a aba de prospects
    const canSeeProspectsTab = caseType === "Half" || caseType === "Prospect";
    const canSeeCommandValidationTab = caseType === "Diretoria" || caseType === "Full-Revisor";

    if (admin) {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        { key: "18", label: t('members'), children: <MembrosPage /> },
        { key: "20", label: t('dashboard'), children: <DashboardTab /> },
        { key: "9", label: t('confirmPayment'), children: <FormMonthlyFee /> },
        { key: "10", label: t('allDebts'), children: <CardCommandAll ref={comandAllTableRef} /> },
        { key: "13", label: t('openOrders'), children: <OpenComandasPageContent ref={comandOpenTableRef} /> },
        { key: "17", label: t('orderHistory'), children: <PaidComandasPageContent ref={paidComandasTableRef} /> },
        { key: "14", label: t('stock'), children: <EstoquePage /> },
        { key: "15", label: t('stockHistory'), children: <HistoricoEstoquePage /> },
        // { key: "16", label: "Créditos", children: <CreditManager /> },
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        // { key: "7", label: "Alterar senha", children: <ChangePasswordForm /> },
        { key: "11", label: <LogoutButton /> },
      ];

      // Adicionar aba de prospects apenas se for Half ou Prospect
      if (canSeeCommandValidationTab) {
        tabs.splice(1, 0, { key: "22", label: t('prospectValidation'), children: <ProspectValidationPage /> });
      }

      return tabs;
    } else if (isBarUser) {
      return [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "12", label: t('guestOrder'), children: <CreateComandaPage /> },
        { key: "13", label: t('openOrders'), children: <OpenComandasPageContent ref={comandOpenTableRef} /> },
        { key: "14", label: t('stock'), children: <EstoquePage /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
      ];
    } else if (manager) {
      return [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        { key: "14", label: t('stock'), children: <EstoquePage /> },
        { key: "15", label: t('stockHistory'), children: <HistoricoEstoquePage /> },
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        // { key: "7", label: "Alterar senha", children: <ChangePasswordForm /> },
        { key: "11", label: <LogoutButton /> },
      ];
      // Adicionar aba de validação dos prospects apenas se for Diretoria ou Full-Revisor
      if (canSeeCommandValidationTab) {
        tabs.splice(1, 0, { key: "22", label: t('prospectValidation'), children: <ProspectValidationPage /> });
      }
    } else {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        // { key: "7", label: "Alterar senha", children: <ChangePasswordForm /> },
        { key: "11", label: <LogoutButton /> },
      ];

      // Adicionar aba de validação dos prospects apenas se for Diretoria ou Full-Revisor
      if (canSeeCommandValidationTab) {
        tabs.splice(1, 0, { key: "22", label: t('prospectValidation'), children: <ProspectValidationPage /> });
      }

      // Adicionar aba de prospects apenas se for Half ou Prospect
      if (canSeeProspectsTab) {
        tabs.splice(3, 0, { key: "21", label: t('prospects'), children: <ProspectsPage /> });
      }

      return tabs;
    }
  };

  const tabs = getCurrentTabs();

  const birthdays: Birthday[] = [
    { name: "Alex", fullDate: "1974-08-12", day: "12" },
    { name: "André", fullDate: "1985-09-12", day: "12" },
    { name: "Athayde", fullDate: "1979-01-24", day: "24" },
    { name: "Bacellar", fullDate: "1962-09-05", day: "05" },
    { name: "Baeza", fullDate: "1977-01-09", day: "09" },
    { name: "Beto", fullDate: "1962-09-07", day: "07" },
    { name: "Beni", fullDate: "1969-02-04", day: "04" },
    { name: "Claudio", fullDate: "1971-10-08", day: "08" },
    { name: "Camargo", fullDate: "1971-06-11", day: "11" },
    { name: "Fernando", fullDate: "1967-11-05", day: "05" },
    { name: "Fagner", fullDate: "1980-10-27", day: "27" },
    { name: "Gulitich", fullDate: "1973-02-19", day: "19" },
    { name: "Guiotto", fullDate: "1984-01-22", day: "22" },
    { name: "Índio", fullDate: "1970-06-25", day: "25" },
    { name: "Jefão", fullDate: "1981-02-04", day: "04" },
    { name: "Jeferson", fullDate: "1974-10-05", day: "05" },
    { name: "Julinho", fullDate: "1980-09-30", day: "30" },
    { name: "Léo", fullDate: "1981-09-27", day: "27" },
    { name: "Madalosso", fullDate: "1988-02-20", day: "20" },
    { name: "Mega", fullDate: "1979-07-31", day: "31" },
    { name: "Mortari", fullDate: "1970-01-18", day: "18" },
    { name: "Dani", fullDate: "1979-08-15", day: "15" },
    { name: "Pacheco", fullDate: "1990-03-04", day: "04" },
    { name: "Rafael", fullDate: "1975-08-09", day: "09" },
    { name: "Rick", fullDate: "1972-01-06", day: "06" },
    { name: "Robson", fullDate: "1987-07-18", day: "18" },
    { name: "Rodrigo ND", fullDate: "1976-08-04", day: "04" },
    { name: "Rogério", fullDate: "1971-11-03", day: "03" },
    { name: "Soares", fullDate: "1991-06-19", day: "19" },
    { name: "Valdinei", fullDate: "1977-08-06", day: "06" },
    { name: "Weriton", fullDate: "1976-04-14", day: "14" },
    { name: "Will", fullDate: "1989-11-04", day: "04" },
    { name: "Zanona", fullDate: "1985-01-02", day: "02" },
    { name: "Zé Carlos", fullDate: "1967-12-08", day: "08" },
    { name: "Zeca", fullDate: "1970-03-05", day: "05" },
    { name: "Zorek", fullDate: "1987-10-02", day: "02" },
  ];

  const birthdaysOfTheMonth = birthdays
    .filter(
      (birthday) => dayjs(birthday.fullDate).month() === new Date().getMonth()
    )
    .sort((a, b) => Number(a.day) - Number(b.day));

  const birthdaysString = birthdaysOfTheMonth
    .map((birthday) => `${birthday.name} (${birthday.day})`)
    .join(", ");

  return (
    <div className="flex flex-col w-full">
      <div className="px-5 pb-5">
        <p className="text-sm">{t('birthdaysOfMonth')} </p>
        <span className="text-sm font-semibold">
          {birthdaysString}
        </span>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex-nowrap overflow-x-auto overflow-y-hidden w-full">
          {tabs.map((tab) => {
            // Se não tem children, é provavelmente o LogoutButton
            if (!tab.children) {
              return (
                <div key={tab.key} className="flex-shrink-0 ml-auto">
                  {tab.label}
                </div>
              );
            }
            
            return (
              <TabsTrigger key={tab.key} value={tab.key} className="whitespace-nowrap flex-shrink-0">
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {tabs.filter((tab) => tab.children).map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {tab.children}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
