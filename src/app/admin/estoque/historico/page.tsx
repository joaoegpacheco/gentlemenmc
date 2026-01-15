"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { message } from "@/lib/message";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { supabase } from "@/hooks/use-supabase";
import { Download, FileText } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type LogType = {
  id: string;
  drink: string;
  quantity: number;
  type: "entrada" | "saida";
  created_at: string;
  user?: string;
};

export default function HistoricoEstoquePage() {
  const t = useTranslations('adminEstoqueHistorico');
  const logs$ = useObservable<LogType[]>([]);
  const startDate$ = useObservable<Date | undefined>(undefined);
  const endDate$ = useObservable<Date | undefined>(undefined);
  const drinkFilter$ = useObservable<string>("");

  const logs = useValue(logs$);
  const startDate = useValue(startDate$);
  const endDate = useValue(endDate$);
  const drinkFilter = useValue(drinkFilter$);

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("estoque_log")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      message.error(t('errors.errorFetchingLogs'));
      return;
    }

    logs$.set(data || []);
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = dayjs(log.created_at);
      const matchesDate =
        (!startDate || !logDate.isBefore(dayjs(startDate), "day")) &&
        (!endDate || !logDate.isAfter(dayjs(endDate), "day"));

      const matchesDrink = log.drink
        .toLowerCase()
        .includes(drinkFilter.toLowerCase());

      return matchesDate && matchesDrink;
    });
  }, [logs, startDate, endDate, drinkFilter]);

  const finalBalanceByDrink = useMemo(() => {
    const balance: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      const current = balance[log.drink] || 0;
      const quantity = Number(log.quantity);

      balance[log.drink] = current + quantity;
    });
    return balance;
  }, [filteredLogs]);

  const gerarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Histórico de Estoque", 14, 20);

    if (startDate || endDate || drinkFilter) {
      doc.setFontSize(10);
      doc.text(
        `Período: ${startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Início"} até ${
          endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Hoje"
        }${drinkFilter ? ` | Bebida: ${drinkFilter}` : ""}`,
        14,
        27
      );
    }

    autoTable(doc, {
      startY: 35,
      head: [["Data", "Bebida", "Tipo", "Quantidade", "Usuário"]],
      body: filteredLogs.map((log) => [
        dayjs(log.created_at).format("DD/MM/YYYY HH:mm"),
        log.drink,
        log.type === "entrada" ? "Entrada" : "Saída",
        log.quantity.toString(),
        log.user || "—",
      ]),
    });

    doc.save("historico_estoque.pdf");
  };

  const exportarCSV = () => {
    const headers = [t('table.date'), t('table.drink'), t('table.type'), t('table.quantity'), t('table.user')];
    const rows = filteredLogs.map((log) => [
      dayjs(log.created_at).format("DD/MM/YYYY HH:mm"),
      log.drink,
      log.type === "entrada" ? t('types.entrada') : t('types.saida'),
      log.quantity,
      log.user || "—",
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell
            )
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", t('export.fileNameCSV'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t('title')}</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : t('filters.startDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={startDate$.set}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : t('filters.endDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={endDate$.set}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          placeholder={t('filters.filterByDrink')}
          value={drinkFilter}
          onChange={(e) => drinkFilter$.set(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={gerarPDF}>
          <FileText className="mr-2 h-4 w-4" />
          {t('buttons.pdf')}
        </Button>
        <Button onClick={exportarCSV}>
          <Download className="mr-2 h-4 w-4" />
          {t('buttons.csv')}
        </Button>
      </div>

      <div className="border rounded-lg mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Bebida</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum log encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.slice(0, 15).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{dayjs(log.created_at).format("DD/MM/YYYY HH:mm")}</TableCell>
                  <TableCell>{log.drink}</TableCell>
                  <TableCell>
                    {log.type === "entrada" && log.quantity > 0 ? (
                      <Badge variant="default" className="bg-green-500">{t('types.entrada')}</Badge>
                    ) : (
                      <Badge variant="destructive">{t('types.saida')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{log.quantity}</TableCell>
                  <TableCell>{log.user || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <h4 className="text-lg font-semibold mb-4">{t('balance.finalBalanceByDrink')}</h4>
      <ul className="list-disc ml-6">
        {Object.entries(finalBalanceByDrink).map(([drink, balance]) => (
          <li key={drink}>
            <strong>{drink}:</strong> {balance} {balance !== 1 ? t('balance.units') : t('balance.unit')}
          </li>
        ))}
      </ul>
    </div>
  );
}
