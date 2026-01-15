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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputNumber } from "@/components/ui/input-number";
import { Input } from "@/components/ui/input";
import { message } from "@/lib/message";
import { Spinner } from "@/components/ui/spinner";
import { updateComanda } from "@/services/comandaService";
import { drinksPricesGuests } from "@/constants/drinks";
import { supabase } from "@/hooks/use-supabase";

interface Props { }

interface AdminData {
  email: string;
  id: string;
}

export const OpenComandasPageContent = forwardRef((_: Props, ref) => {
  const t = useTranslations('openComandas');
  const comandas$ = useObservable<any[]>([]);
  const loading$ = useObservable(false);
  const selectedComanda$ = useObservable<any | null>(null);
  const newDrink$ = useObservable<string>("");
  const isBarMC$ = useObservable<boolean>(false);
  const quantity$ = useObservable<number>(1);
  const payModalVisible$ = useObservable(false);
  const adminsList$ = useObservable<AdminData[]>([]);
  const selectedAdmin$ = useObservable<string | null>(null);
  const adminPassword$ = useObservable("");
  const payingComandaId$ = useObservable<number | null>(null);
  const itemsModalOpen$ = useObservable(false);
  const selectedItemsRecord$ = useObservable<any>(null);

  const comandas = useValue(comandas$);
  const loading = useValue(loading$);
  const selectedComanda = useValue(selectedComanda$);
  const newDrink = useValue(newDrink$);
  const isBarMC = useValue(isBarMC$);
  const quantity = useValue(quantity$);
  const payModalVisible = useValue(payModalVisible$);
  const adminsList = useValue(adminsList$);
  const selectedAdmin = useValue(selectedAdmin$);
  const adminPassword = useValue(adminPassword$);
  const payingComandaId = useValue(payingComandaId$);
  const itemsModalOpen = useValue(itemsModalOpen$);
  const selectedItemsRecord = useValue(selectedItemsRecord$);

  const fetchAdmins = async () => {
    const { data, error } = await supabase.from("admins").select("id, email");
    if (error) {
      message.error(t('errorFetchingAdmins'));
    } else {
      adminsList$.set(data);
    }
  };

  const handleConfirmPay = async () => {
    if (!selectedAdmin || !adminPassword) {
      message.warning(t('selectAdminAndPassword'));
      return;
    }

    // Tenta autenticar com o admin selecionado
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: selectedAdmin,
      password: adminPassword,
    });

    if (loginError) {
      message.error(t('incorrectUserOrPassword'));
      return;
    }

    // Busca a comanda com seus itens para calcular o total
    const { data: comandaData, error: fetchError } = await supabase
      .from("comandas")
      .select("*, comanda_itens!comanda_itens_comanda_id_fkey(*)")
      .eq("id", payingComandaId)
      .single();

    if (fetchError || !comandaData) {
      message.error(t('errorFetchingComandaData'));
      return;
    }

    // Calcula o valor total da comanda
    const valorTotal = comandaData.comanda_itens.reduce(
      (sum: number, item: any) => sum + (item.quantidade * item.preco_unitario),
      0
    );

    // Após autenticar, atualiza a comanda com paga: true e valor_total
    const { error } = await supabase
      .from("comandas")
      .update({
        paga: true,
        valor_total: valorTotal
      })
      .eq("id", payingComandaId);

    if (error) {
      message.error(t('errorPayingComanda'));
    } else {
      message.success(t('comandaPaidSuccessfully'));
      fetchComandas();
    }

    // Resetar estado
    payModalVisible$.set(false);
    selectedAdmin$.set(null);
    adminPassword$.set("");
    payingComandaId$.set(null);
  };

  const fetchComandas = async () => {
    loading$.set(true);

    const { data, error } = await supabase
      .from("comandas")
      .select("*, comanda_itens!comanda_itens_comanda_id_fkey(*)")
      .eq("paga", false)
      .order("created_at", { ascending: false });

    if (error) {
      message.error(t('errorFetchingComandas'));
    } else {
      comandas$.set(data);
    }
    loading$.set(false);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    // Caso seja o email do Bar MC
    if (user?.email === "barmc@gentlemenmc.com.br") {
      isBarMC$.set(true);
      return;
    }
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

  const handleAddDrink = async () => {
    if (!selectedComanda || !newDrink) return;

    const existingItems = selectedComanda.comanda_itens;
    const drinkExists = existingItems.find((i: any) => i.bebida_nome === newDrink);
    let updatedItems;

    if (drinkExists) {
      updatedItems = existingItems.map((i: any) =>
        i.bebida_nome === newDrink
          ? { ...i, quantidade: i.quantidade + quantity }
          : i
      );
    } else {
      updatedItems = [
        ...existingItems,
        {
          drink: newDrink,
          quantity,
          price: drinksPricesGuests[newDrink],
        },
      ];
    }

    const mappedItems = updatedItems.map((i: any) => ({
      id: i.id,
      drink: i.bebida_nome || i.drink,
      quantity: i.quantidade || i.quantity,
      price: i.preco_unitario || i.price,
    }));

    await updateComanda({
      id: selectedComanda.id,
      guestName: selectedComanda.nome_convidado,
      items: mappedItems,
    });

    message.success(t('drinkAdded'));
    selectedComanda$.set(null);
    newDrink$.set("");
    quantity$.set(1);
    fetchComandas();
  };

  const comandasWithTotals = comandas.map((c) => ({
    ...c,
    total: c.comanda_itens.reduce((sum: number, i: any) => sum + i.quantidade * i.preco_unitario, 0),
  }));

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{t('openComandas')}</h1>
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
                <TableHead>{t('member')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('items')}</TableHead>
                <TableHead>{t('total')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comandasWithTotals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t('noOpenComandas')}
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
                      <TableCell>{record.nome_integrante}</TableCell>
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
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => selectedComanda$.set(record)}>
                            {t('addDrink')}
                          </Button>
                          {!isBarMC && (
                            <Button
                              variant="destructive"
                              onClick={() => {
                                payingComandaId$.set(record.id);
                                fetchAdmins();
                                payModalVisible$.set(true);
                              }}
                            >
                              {t('markAsPaid')}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={!!selectedComanda} onOpenChange={(open) => !open && selectedComanda$.set(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{t('addDrinkToComanda', { name: selectedComanda?.nome_convidado })}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(drinksPricesGuests).map(([drink, price]) => (
                <Button
                  key={drink}
                  variant={newDrink === drink ? "default" : "outline"}
                  onClick={() => newDrink$.set(drink)}
                  className="min-w-[120px] h-16 whitespace-pre-wrap flex flex-col"
                >
                  {drink}
                  <span className="text-xs">R$ {price.toFixed(2)}</span>
                </Button>
              ))}
            </div>
            <InputNumber
              min={1}
              value={quantity}
              onChange={(val) => quantity$.set(val ?? 1)}
              placeholder={t('quantity')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => selectedComanda$.set(null)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleAddDrink}>
              {t('add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  {item.quantidade} x R$ {item.preco_unitario.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => itemsModalOpen$.set(false)}>{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payModalVisible} onOpenChange={(open) => {
        if (!open) {
          payModalVisible$.set(false);
          selectedAdmin$.set(null);
          adminPassword$.set("");
          payingComandaId$.set(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmPayment')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Select value={selectedAdmin || ""} onValueChange={(value) => selectedAdmin$.set(value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectAdministrator')} />
              </SelectTrigger>
              <SelectContent>
                {adminsList.map((admin) => (
                  <SelectItem key={admin.id} value={admin.email}>
                    {admin.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="password"
              value={adminPassword}
              onChange={(e) => adminPassword$.set(e.target.value)}
              placeholder={t('adminPassword')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              payModalVisible$.set(false);
              selectedAdmin$.set(null);
              adminPassword$.set("");
              payingComandaId$.set(null);
            }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleConfirmPay}>
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
})

OpenComandasPageContent.displayName = "OpenComandasPageContent";