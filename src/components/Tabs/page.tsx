"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormCommand } from "@/components/Form/page";
import { CardCommand } from "@/components/CardDrinks/page";
import { CardCommandAll } from "@/components/CardDrinksAll/page";
// import { InvoiceTable } from "@/components/InvoiceTable/page";
// import { InvoiceForm } from "@/components/InvoiceForm/page";
// import { ChangePasswordForm } from "@/components/ChangePasswordForm/page";
import OverviewFinancePage from "@/components/OverviewFinancePage/page";
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

/** Mesmo email autorizado a confirmar retorno de pagamento (PaymentReturnClient). */
const PAYMENT_CONFIRM_TAB_COMMAND_EMAIL = "mortari@gentlemenmc.com.br";

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
  const isFacilitiesUser$ = useObservable<boolean>(false);
  const caseType$ = useObservable<string | null>(null);
  const activeTab$ = useObservable("1");
  const command$ = useObservable<boolean | null>(null);
  const birthdays$ = useObservable<Birthday[]>([]);
  const userEmail$ = useObservable<string | null>(null);

  const admin = useValue(admin$);
  const manager = useValue(manager$);
  const command = useValue(command$);
  const isBarUser = useValue(isBarUser$);
  const isFacilitiesUser = useValue(isFacilitiesUser$);
  const caseType = useValue(caseType$);
  const activeTab = useValue(activeTab$);
  const birthdays = useValue(birthdays$);
  const userEmail = useValue(userEmail$);

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

      userEmail$.set(user.email?.trim().toLowerCase() ?? "");

      isBarUser$.set(user.email === "barmc@gentlemenmc.com.br");
      manager$.set(user.email === "robson@gentlemenmc.com.br");
      isFacilitiesUser$.set(user.email === "guiotto@gentlemenmc.com.br");

      try {
        const { data: admins }: PostgrestResponse<AdminData> = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .eq("role", "admin");

        admin$.set(!!admins?.length);

        const { data: command }: PostgrestResponse<AdminData> = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .eq("role", "command");
        command$.set(!!command?.length);
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

  useEffect(() => {
    const loadBirthdays = async () => {
      const { data, error } = await supabase
        .from("membros")
        .select("user_name, date_of_birth")
        .not("date_of_birth", "is", null)
        .order("user_name", { ascending: true });

      if (error) {
        console.error("Erro ao carregar aniversariantes:", error);
        birthdays$.set([]);
        return;
      }

      const currentMonth = new Date().getMonth();
      const list: Birthday[] = (data ?? [])
        .filter(
          (row) =>
            row.user_name &&
            row.date_of_birth &&
            dayjs(row.date_of_birth).month() === currentMonth
        )
        .map((row) => {
          const d = dayjs(row.date_of_birth);
          return {
            name: row.user_name as string,
            fullDate: d.format("YYYY-MM-DD"),
            day: d.format("DD"),
          };
        })
        .sort((a, b) => Number(a.day) - Number(b.day));

      birthdays$.set(list);
    };

    loadBirthdays();
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
    const canSeeConfirmPaymentTabAsCommand =
      userEmail === PAYMENT_CONFIRM_TAB_COMMAND_EMAIL;

    if (admin) {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "12", label: t('guestOrder'), children: <CreateComandaPage /> },
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
        { key: "23", label: "Financeiro", children: <OverviewFinancePage /> },
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        // { key: "7", label: "Alterar senha", children: <ChangePasswordForm /> },
        { key: "11", label: <LogoutButton /> },
      ];

      // Adicionar aba de prospects apenas se for Half ou Prospect
      if (canSeeCommandValidationTab) {
        tabs.splice(1, 0, { key: "22", label: t('prospectValidation'), children: <ProspectValidationPage /> });
      }

      return tabs;
    } else if (command) {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        { key: "18", label: t('members'), children: <MembrosPage /> },
        { key: "10", label: t('allDebts'), children: <CardCommandAll ref={comandAllTableRef} /> },
        ...(canSeeConfirmPaymentTabAsCommand
          ? [{ key: "9", label: t('confirmPayment'), children: <FormMonthlyFee /> } as const]
          : []),
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
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
        { key: "6", label: t('statute'), children: <ByLaw /> },
      ];
    } else if (isFacilitiesUser) {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "14", label: t('stock'), children: <EstoquePage /> },
        { key: "15", label: t('stockHistory'), children: <HistoricoEstoquePage /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        { key: "11", label: <LogoutButton /> },
      ];

      // Adicionar aba de prospects apenas se for Half ou Prospect
      if (canSeeProspectsTab) {
        tabs.splice(3, 0, { key: "21", label: t('prospects'), children: <ProspectsPage /> });
      }

      return tabs;
    } else if (manager) {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        { key: "14", label: t('stock'), children: <EstoquePage /> },
        { key: "15", label: t('stockHistory'), children: <HistoricoEstoquePage /> },
        { key: "17", label: t('orderHistory'), children: <PaidComandasPageContent ref={paidComandasTableRef} /> },
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        // { key: "7", label: "Alterar senha", children: <ChangePasswordForm /> },
        { key: "11", label: <LogoutButton /> },
      ];
      // Adicionar aba de validação dos prospects apenas se for Diretoria ou Full-Revisor
      if (canSeeCommandValidationTab) {
        tabs.splice(1, 0, { key: "22", label: t('prospectValidation'), children: <ProspectValidationPage /> });
      }

      return tabs;
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

  const birthdaysString = birthdays
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
