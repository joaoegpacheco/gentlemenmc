"use client";

import { useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { message } from "@/lib/message";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/hooks/use-supabase";

interface Props {}

export const PaidComandasPageContent = forwardRef((_: Props, ref) => {
  const t = useTranslations('paidComandas');
  const comandas$ = useObservable<any[]>([]);
  const loading$ = useObservable(false);
  const itemsModalOpen$ = useObservable(false);
  const selectedItemsRecord$ = useObservable<any>(null);

  const comandas = useValue(comandas$);
  const loading = useValue(loading$);
  const itemsModalOpen = useValue(itemsModalOpen$);
  const selectedItemsRecord = useValue(selectedItemsRecord$);

  const fetchComandas = async () => {
    loading$.set(true);
    const { data, error } = await supabase
      .from("comandas")
      .select("*, comanda_itens!comanda_itens_comanda_id_fkey(*)")
      .eq("paga", true)
      .order("created_at", { ascending: false });

    if (error) {
      message.error(t('errorFetchingPaidComandas'));
    } else {
      comandas$.set(data);
    }
    loading$.set(false);
  };

  useEffect(() => {
    fetchComandas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    refreshData: () => {
      fetchComandas();
    },
  }));

  const comandasWithTotals = comandas.map((c) => ({
    ...c,
    total: c.valor_total || c.comanda_itens.reduce((sum: number, i: any) => sum + i.quantidade * i.preco_unitario, 0),
  }));

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{t('paidComandasHistory')}</h1>
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('items')}</TableHead>
                <TableHead>{t('total')}</TableHead>
                <TableHead>{t('paymentDate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comandasWithTotals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t('noPaidComandasFound')}
                  </TableCell>
                </TableRow>
              ) : (
                comandasWithTotals.map((record) => {
                  const totalQtd = record.comanda_itens.reduce(
                    (sum: number, i: any) => sum + i.quantidade,
                    0
                  );
                  return (
                    <TableRow key={record.id}>
                      <TableCell>{record.nome_convidado}</TableCell>
                      <TableCell>{record.telefone_convidado}</TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          onClick={() => {
                            selectedItemsRecord$.set(record);
                            itemsModalOpen$.set(true);
                          }}
                        >
                          {totalQtd} {t('drinks')}
                        </Button>
                      </TableCell>
                      <TableCell>R$ {record.total.toFixed(2)}</TableCell>
                      <TableCell>{formatDate(record.created_at)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={itemsModalOpen} onOpenChange={itemsModalOpen$.set}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('comandaItems', { name: selectedItemsRecord?.nome_convidado })}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            {selectedItemsRecord?.comanda_itens.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between border-b border-gray-300 pb-1"
              >
                <span>{item.bebida_nome}</span>
                <span>
                  {item.quantidade} x R$ {item.preco_unitario.toFixed(2)} = R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                </span>
              </div>
            ))}
            {selectedItemsRecord && (
              <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                <span>{t('totalLabel')}</span>
                <span>R$ {comandasWithTotals.find(c => c.id === selectedItemsRecord.id)?.total.toFixed(2) || "0.00"}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => itemsModalOpen$.set(false)}>{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
})

PaidComandasPageContent.displayName = "PaidComandasPageContent";

