"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  Tag,
  Typography,
  message,
  DatePicker,
  Space,
  Input,
  Divider,
} from "antd";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { supabase } from "@/hooks/use-supabase";
import { DownloadOutlined, FilePdfOutlined } from "@ant-design/icons";

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
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
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
        (!startDate || !logDate.isBefore(startDate, "day")) &&
        (!endDate || !logDate.isAfter(endDate, "day"));

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
        `Período: ${startDate?.format("DD/MM/YYYY") || "Início"} até ${
          endDate?.format("DD/MM/YYYY") || "Hoje"
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
    <div style={{padding: 15}} className="p-6 max-w-6xl mx-auto">
      <Typography.Title level={2}>📊 Histórico de Estoque</Typography.Title>

      <Space style={{ marginBottom: 16 }} wrap>
        <DatePicker
          placeholder="Data inicial"
          value={startDate}
          onChange={(date) => setStartDate(date)}
          format="DD/MM/YYYY"
        />
        <DatePicker
          placeholder="Data final"
          value={endDate}
          onChange={(date) => setEndDate(date)}
          format="DD/MM/YYYY"
        />
        <Input
          placeholder="Filtrar por bebida"
          value={drinkFilter}
          onChange={(e) => setDrinkFilter(e.target.value)}
        />
        <Button icon={<FilePdfOutlined />} onClick={gerarPDF}>
          PDF
        </Button>
        <Button icon={<DownloadOutlined />} onClick={exportarCSV}>
          CSV
        </Button>
      </Space>

      <Divider />

      <Table
        dataSource={filteredLogs.map((log) => ({ ...log, key: log.id }))}
        pagination={{ pageSize: 15 }}
        columns={[
          {
            title: "Data",
            dataIndex: "created_at",
            render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
          },
          {
            title: "Bebida",
            dataIndex: "drink",
          },
          {
            title: "Tipo",
            dataIndex: "type",
            render: (_: any, record: { type: string; quantity: number }) =>
              record.type === "entrada" && record.quantity > 0 ? (
                <Tag color="green">Entrada</Tag>
              ) : (
                <Tag color="red">Saída</Tag>
              ),
          },
          {
            title: "Quantidade",
            dataIndex: "quantity",
          },
          {
            title: "Usuário",
            dataIndex: "user",
            render: (user) => user || "—",
          },
        ]}
      />

      <Divider />

      <Typography.Title level={4}>📦 Saldo final por bebida:</Typography.Title>
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
