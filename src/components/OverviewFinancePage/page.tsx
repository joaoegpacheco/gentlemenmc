"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useObservable, useValue } from "@legendapp/state/react";
import { supabase } from "@/hooks/use-supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Spinner } from "@/components/ui/spinner";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import { formatCurrency } from "@/utils/formatCurrency";

interface RecordItem {
  id: string;
  tipo: "membro" | "convidado" | "direta";
  nome: string;
  telefone?: string;
  total: number;
  created_at: string;
  itens: any[];
}

export default function OverviewFinancePage() {
  const t = useTranslations("overview");

  const loading$ = useObservable(false);
  const records$ = useObservable<RecordItem[]>([]);
  const filterType$ = useObservable("all");
  const filterPeriod$ = useObservable("month");

  const modalOpen$ = useObservable(false);
  const selectedRecord$ = useObservable<RecordItem | null>(null);

  const loading = useValue(loading$);
  const records = useValue(records$);
  const filterType = useValue(filterType$);
  const filterPeriod = useValue(filterPeriod$);
  const modalOpen = useValue(modalOpen$);
  const selectedRecord = useValue(selectedRecord$);

  const fetchData = async () => {
    loading$.set(true);

    try {
      /* ---------------------------
      MEMBROS (tabela bebidas)
      --------------------------- */

      const { data: bebidas } = await supabase
        .from("bebidas")
        .select("*")
        .order("created_at", { ascending: false });

      const membrosRecords: RecordItem[] =
        bebidas?.map((b: any): RecordItem => ({
          id: `membro-${b.id}`,
          tipo: "membro",
          nome: b.user_name,
          telefone: b.phone,
          total: b.price || 0,
          created_at: b.created_at,
          itens: [
            {
              bebida_nome: b.drink_name || "Bebida",
              quantidade: 1,
              preco_unitario: b.price,
            },
          ],
        })) || [];

      /* ---------------------------
      CONVIDADOS + VENDA DIRETA
      --------------------------- */

      const { data: comandas } = await supabase
        .from("comandas")
        .select(`
    *,
    comanda_itens!comanda_itens_comanda_id_fkey(*)
  `)
        .order("created_at", { ascending: false });

      const comandasRecords: RecordItem[] =
        comandas?.map((c: any): RecordItem => ({
          id: `comanda-${c.id}`,
          tipo: c.telefone_convidado ? "convidado" : "direta",
          nome: c.nome_convidado || c.nome || "Venda direta",
          telefone: c.telefone_convidado,
          total:
            c.valor_total ||
            c.comanda_itens.reduce(
              (sum: number, i: any) =>
                sum + i.quantidade * i.preco_unitario,
              0
            ),
          created_at: c.created_at,
          itens: c.comanda_itens,
        })) || [];

      /* ---------------------------
      UNIFICAR TUDO
      --------------------------- */

      const allRecords: RecordItem[] = [
        ...membrosRecords,
        ...comandasRecords,
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      records$.set(allRecords);
    } catch (err) {
      console.error(err);
    }

    loading$.set(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRecords = useMemo(() => {
    const now = new Date();

    return records.filter((r) => {
      const date = new Date(r.created_at);

      const typeMatch =
        filterType === "all" || r.tipo === filterType;

      let periodMatch = true;

      if (filterPeriod === "today") {
        periodMatch =
          date.toDateString() === now.toDateString();
      }

      if (filterPeriod === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        periodMatch = date >= weekAgo;
      }

      if (filterPeriod === "month") {
        periodMatch =
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear();
      }

      return typeMatch && periodMatch;
    });
  }, [records, filterType, filterPeriod]);

  const total = filteredRecords.reduce(
    (sum, r) => sum + r.total,
    0
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <h1 className="text-2xl font-bold">
          {t("financialOverview")}
        </h1>

        <div className="flex gap-2">

          <Select
            value={filterType}
            onValueChange={filterType$.set}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                {t("all")}
              </SelectItem>
              <SelectItem value="membro">
                {t("members")}
              </SelectItem>
              <SelectItem value="convidado">
                {t("guests")}
              </SelectItem>
              <SelectItem value="direta">
                {t("directSales")}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterPeriod}
            onValueChange={filterPeriod$.set}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="today">
                {t("today")}
              </SelectItem>

              <SelectItem value="week">
                {t("week")}
              </SelectItem>

              <SelectItem value="month">
                {t("month")}
              </SelectItem>

              <SelectItem value="all">
                {t("allTime")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TOTAL */}

      <Card>
        <CardHeader>
          <CardTitle>{t("totalRevenue")}</CardTitle>
        </CardHeader>

        <CardContent className="text-3xl font-bold">
          {formatCurrency(total)}
        </CardContent>
      </Card>

      {/* LISTA */}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="border rounded-lg">

          <Table>

            <TableHeader>
              <TableRow>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("items")}</TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead>{t("date")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>

              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-muted-foreground"
                  >
                    {t("noRecords")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>

                    <TableCell>
                      <Badge variant="outline">
                        {record.tipo}
                      </Badge>
                    </TableCell>

                    <TableCell>

                      <Button
                        variant="link"
                        onClick={() => {
                          selectedRecord$.set(record);
                          modalOpen$.set(true);
                        }}
                      >
                        {record.itens.length}
                      </Button>

                    </TableCell>

                    <TableCell>
                      {formatCurrency(record.total)}
                    </TableCell>

                    <TableCell>
                      {formatDate(record.created_at)}
                    </TableCell>

                  </TableRow>
                ))
              )}

            </TableBody>

          </Table>

        </div>
      )}

      {/* MODAL ITENS */}

      <Dialog open={modalOpen} onOpenChange={modalOpen$.set}>
        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              Itens - {selectedRecord?.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">

            {selectedRecord?.itens.map((item: any, idx) => (
              <div
                key={idx}
                className="flex justify-between border-b pb-1"
              >
                <span>{item.bebida_nome}</span>

                <span>
                  {item.quantidade} ×{" "}
                  {formatCurrency(item.preco_unitario)}
                </span>
              </div>
            ))}

          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}