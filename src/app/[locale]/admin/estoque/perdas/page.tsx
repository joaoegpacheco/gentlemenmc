"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useObservable, useValue } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { message } from "@/lib/message";
import dayjs from "dayjs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  calcularTotaisPerdas,
  calcularTotaisPorBebida,
  getPerdasConsumo,
  type PerdaConsumoRow,
} from "@/services/estoquePerdasService";

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function PerdasConsumoPage() {
  const t = useTranslations("stockLosses");
  const rows$ = useObservable<PerdaConsumoRow[]>([]);
  const startDate$ = useObservable<Date | undefined>(undefined);
  const endDate$ = useObservable<Date | undefined>(undefined);
  const drinkFilter$ = useObservable("");

  const rows = useValue(rows$);
  const startDate = useValue(startDate$);
  const endDate = useValue(endDate$);
  const drinkFilter = useValue(drinkFilter$);

  async function fetchRows() {
    try {
      rows$.set(await getPerdasConsumo());
    } catch {
      message.error(t("errors.fetch"));
    }
  }

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const d = dayjs(row.created_at);
      const okDate =
        (!startDate || !d.isBefore(dayjs(startDate), "day")) &&
        (!endDate || !d.isAfter(dayjs(endDate), "day"));
      const okDrink = row.drink_name
        .toLowerCase()
        .includes(drinkFilter.toLowerCase());
      return okDate && okDrink;
    });
  }, [rows, startDate, endDate, drinkFilter]);

  const totais = useMemo(() => calcularTotaisPerdas(filtered), [filtered]);
  const porBebida = useMemo(() => calcularTotaisPorBebida(filtered), [filtered]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">{t("title")}</h2>
      <p className="text-muted-foreground mb-6">{t("description")}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("summary.totalCost")}</p>
            <p className="text-2xl font-bold text-destructive">{brl(totais.total_cost)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("summary.units", { count: totais.quantity })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("summary.totalMember")}</p>
            <p className="text-2xl font-bold">{brl(totais.total_member)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("summary.memberHint")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("summary.totalGuest")}</p>
            <p className="text-2xl font-bold">{brl(totais.total_guest)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("summary.guestHint")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : t("filters.startDate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={startDate} onSelect={startDate$.set} initialFocus />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : t("filters.endDate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={endDate} onSelect={endDate$.set} initialFocus />
          </PopoverContent>
        </Popover>
        <Input
          placeholder={t("filters.drink")}
          value={drinkFilter}
          onChange={(e) => drinkFilter$.set(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <h4 className="text-lg font-semibold mb-3">{t("byDrink")}</h4>
      <div className="border rounded-lg mb-8 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.drink")}</TableHead>
              <TableHead>{t("table.quantity")}</TableHead>
              <TableHead>{t("table.totalCost")}</TableHead>
              <TableHead>{t("table.totalMember")}</TableHead>
              <TableHead>{t("table.totalGuest")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {porBebida.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            ) : (
              porBebida.map((row) => (
                <TableRow key={row.drink_name}>
                  <TableCell>{row.drink_name}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{brl(row.total_cost)}</TableCell>
                  <TableCell>{brl(row.total_member)}</TableCell>
                  <TableCell>{brl(row.total_guest)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <h4 className="text-lg font-semibold mb-3">{t("history")}</h4>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.date")}</TableHead>
              <TableHead>{t("table.drink")}</TableHead>
              <TableHead>{t("table.quantity")}</TableHead>
              <TableHead>{t("table.totalCost")}</TableHead>
              <TableHead>{t("table.totalMember")}</TableHead>
              <TableHead>{t("table.totalGuest")}</TableHead>
              <TableHead>{t("table.user")}</TableHead>
              <TableHead>{t("table.notes")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{dayjs(row.created_at).format("DD/MM/YYYY HH:mm")}</TableCell>
                  <TableCell>{row.drink_name}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{row.quantity}</Badge>
                  </TableCell>
                  <TableCell>{brl(row.total_cost)}</TableCell>
                  <TableCell>{brl(row.total_member)}</TableCell>
                  <TableCell>{brl(row.total_guest)}</TableCell>
                  <TableCell>{row.user || "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{row.notes || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
