"use client";

import { useEffect, useState, useMemo } from "react";
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
  const [logs, setLogs] = useState<LogType[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [drinkFilter, setDrinkFilter] = useState<string>("");

  async function fetchLogs() {
    const { data, error } = await supabase
      .from("estoque_log")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      message.error("Erro ao buscar logs");
      return;
    }

    setLogs(data || []);
  }

  useEffect(() => {
    fetchLogs();
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
    const headers = ["Data", "Bebida", "Tipo", "Quantidade", "Usuário"];
    const rows = filteredLogs.map((log) => [
      dayjs(log.created_at).format("DD/MM/YYYY HH:mm"),
      log.drink,
      log.type === "entrada" ? "Entrada" : "Saída",
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
    link.setAttribute("download", "historico_estoque.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">📊 Histórico de Estoque</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          placeholder="Filtrar por bebida"
          value={drinkFilter}
          onChange={(e) => setDrinkFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={gerarPDF}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Button onClick={exportarCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV
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
                      <Badge variant="default" className="bg-green-500">Entrada</Badge>
                    ) : (
                      <Badge variant="destructive">Saída</Badge>
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

      <h4 className="text-lg font-semibold mb-4">📦 Saldo final por bebida:</h4>
      <ul className="list-disc ml-6">
        {Object.entries(finalBalanceByDrink).map(([drink, balance]) => (
          <li key={drink}>
            <strong>{drink}:</strong> {balance} unidade{balance !== 1 ? "s" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
