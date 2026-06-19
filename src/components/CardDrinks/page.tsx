"use client";
import {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/utils/formatDateTime";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/hooks/use-supabase";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslations } from 'next-intl';

interface Drink {
  id: string;
  created_at: string;
  name: string;
  drink: string;
  paid: boolean;
  quantity: number;
  price: number;
  user: string;
  uuid: string;
}

interface Member {
  user_id: string;
  user_name: string;
}

interface AdminData {
  id: string;
}

const GENERAL_ADMIN_EMAILS = [
  "robson@gentlemenmc.com.br",
  "rodrigo@gentlemenmc.com.br",
] as const;

function isGeneralAdminEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return GENERAL_ADMIN_EMAILS.includes(
    normalized as (typeof GENERAL_ADMIN_EMAILS)[number]
  );
}

export const CardCommand = forwardRef((_, ref) => {
  const t = useTranslations('cardDrinks');
  const tCommon = useTranslations('common');
  const userData$ = useObservable<{ id: string; email?: string } | null>(null);
  const isAdmin$ = useObservable(false);
  const isGeneralAdmin$ = useObservable(false);
  const isBarMC$ = useObservable(false);
  const selectedUUID$ = useObservable<string | null>(null);
  const members$ = useObservable<Member[]>([]);
  const totalAmount$ = useObservable<number>(0);
  const drinksData$ = useObservable<Drink[]>([]);
  const todayBR$ = useObservable<string>("");

  const userData = useValue(userData$);
  const isAdmin = useValue(isAdmin$);
  const isGeneralAdmin = useValue(isGeneralAdmin$);
  const isBarMC = useValue(isBarMC$);
  const selectedUUID = useValue(selectedUUID$);
  const members = useValue(members$);
  const totalAmount = useValue(totalAmount$);
  const drinksData = useValue(drinksData$);
  const todayBR = useValue(todayBR$);

  const fetchUserData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    userData$.set(user);
    if (!user) return;

    const now = new Date();
    const brToday = now.toLocaleDateString("pt-BR"); // dd/mm/aaaa
    todayBR$.set(brToday);

    // Caso seja o email do Bar MC → "admin limitado ao dia atual"
    if (user.email === "barmc@gentlemenmc.com.br") {
      isAdmin$.set(true);
      isBarMC$.set(true);
      return;
    }

    // Verifica se é admin de verdade
    const { data: admins } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .eq("role", "admin");

    const adminStatus = !!(admins && admins.length > 0);
    const generalAdmin = isGeneralAdminEmail(user.email);
    isGeneralAdmin$.set(generalAdmin);
    isAdmin$.set(adminStatus || generalAdmin);

    if (adminStatus || generalAdmin) {
      const { data: membersData } = await supabase
        .from("membros")
        .select("user_id, user_name")
        .order("user_name", { ascending: true });

      members$.set(membersData || []);
    }

    // Admin geral: vê todas as marcações (sem filtrar por UUID próprio)
    if (generalAdmin) {
      return;
    }

    selectedUUID$.set(user.id);
  };

  const fetchDrinks = useCallback(
    async (uuid: string | null = null) => {
      // Limpa os dados antes de buscar para evitar mostrar dados antigos
      drinksData$.set([]);
      totalAmount$.set(0);

      let query = supabase
        .from("bebidas")
        .select("created_at, name, drink, paid, quantity, price, user, uuid")
        .order("created_at", { ascending: false });

      if (isBarMC) {
        // Data no fuso de São Paulo (America/Sao_Paulo)
        const formatter = new Intl.DateTimeFormat("sv-SE", {
          timeZone: "America/Sao_Paulo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const parts = formatter.formatToParts(new Date());
        const year = parts.find(p => p.type === "year")?.value;
        const month = parts.find(p => p.type === "month")?.value;
        const day = parts.find(p => p.type === "day")?.value;
        const isoToday = `${year}-${month}-${day}`;

        const startOfDaySP = new Date(`${isoToday}T00:00:00-03:00`);
        const endOfDaySP = new Date(`${isoToday}T23:59:59-03:00`);

        query = query
          .gte("created_at", startOfDaySP.toISOString())
          .lte("created_at", endOfDaySP.toISOString());
      } else if (uuid) {
        // Admin normal ou usuário comum → filtra pelo UUID
        query = query.eq("uuid", uuid);
      } else if (isGeneralAdmin) {
        // Admin geral sem membro selecionado → todas as marcações
      } else {
        // Se não há UUID e não é BarMC, não busca nada
        drinksData$.set([]);
        totalAmount$.set(0);
        return;
      }

      const { data: drinks } = await query.select();

      const total =
        drinks?.reduce(
          (sum: number, { paid, price }: { paid: boolean; price: number }) =>
            !paid ? sum + parseFloat(price.toString()) : sum,
          0
        ) || 0;

      drinksData$.set(drinks || []);
      totalAmount$.set(total);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isBarMC, isGeneralAdmin]
  );

  useImperativeHandle(ref, () => ({
    refreshData: () => fetchDrinks(selectedUUID),
  }));

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userData) return; // Aguarda os dados do usuário
    
    if (isBarMC || isGeneralAdmin) {
      fetchDrinks(selectedUUID);
    } else if (selectedUUID) {
      fetchDrinks(selectedUUID);
    }
  }, [selectedUUID, isBarMC, isGeneralAdmin, fetchDrinks, userData]);

  return (
    <div>
      {!isBarMC && isAdmin && (
        <div className="mb-4">
          <Select
            value={selectedUUID ?? (isGeneralAdmin ? "all" : "")}
            onValueChange={(value) =>
              selectedUUID$.set(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder={t('filterByUser')} />
            </SelectTrigger>
            <SelectContent>
              {isGeneralAdmin && (
                <SelectItem value="all">{t('allMembers')}</SelectItem>
              )}
              {members.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.user_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {userData && (
        <div className="mb-4 text-lg font-semibold">
          {isBarMC
            ? t('markedDrinksToday', { date: todayBR })
            : t('unpaidTotal', { amount: formatCurrency(totalAmount) })}
        </div>
      )}

      {drinksData.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t('noDrinksMarked')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {drinksData.map((item) => (
            <Card key={item.id || `${item.created_at}-${item.drink}-${item.name}-${item.uuid}`}>
              <CardHeader>
                <CardTitle>
                  {isBarMC || (isGeneralAdmin && !selectedUUID) ? (
                    <>
                      {item.drink}
                      <br />
                      {item.name}
                    </>
                  ) : (
                    item.drink
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{t('date')}: {formatDateTime(item.created_at)}</p>
                <p className="text-sm">{t('quantity')}: {item.quantity}</p>
                <p className="text-sm">{t('value')}: {formatCurrency(item.price)}</p>
                {!isBarMC && (
                  <p className="text-sm flex items-center gap-2">
                    {t('paid')}{" "}
                    {item.paid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </p>
                )}
                {!isBarMC && item.user && (
                  <p className="text-sm">{t('markedBy', { user: item.user })}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

CardCommand.displayName = "CardCommand";
