"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
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
import { DRINKS_PRICES } from "@/constants/drinks";
import { supabase } from "@/hooks/use-supabase";

interface Props {}

interface AdminData {
  email: string;
  id: string;
}

export const OpenComandasPageContent = forwardRef((_: Props, ref) => {
  const [comandas, setComandas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<any | null>(null);
  const [newDrink, setNewDrink] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [adminsList, setAdminsList] = useState<AdminData[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null); // email
  const [adminPassword, setAdminPassword] = useState("");
  const [payingComandaId, setPayingComandaId] = useState<number | null>(null);

  const fetchAdmins = async () => {
    const { data, error } = await supabase.from("admins").select("id, email");
    if (error) {
      message.error("Erro ao buscar administradores");
    } else {
      setAdminsList(data);
    }
  };

  const handleConfirmPay = async () => {
    if (!selectedAdmin || !adminPassword) {
      message.warning("Selecione um admin e digite a senha");
      return;
    }

    // Tenta autenticar com o admin selecionado
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: selectedAdmin,
      password: adminPassword,
    });

    if (loginError) {
      message.error("Usuário ou senha incorretos");
      return;
    }

    // Após autenticar, atualiza a comanda
    const { error } = await supabase
      .from("comandas")
      .update({ paga: true })
      .eq("id", payingComandaId);

    if (error) {
      message.error("Erro ao pagar comanda");
    } else {
      message.success("Comanda paga com sucesso");
      fetchComandas();
    }

    // Resetar estado
    setPayModalVisible(false);
    setSelectedAdmin(null);
    setAdminPassword("");
    setPayingComandaId(null);
  };

  const fetchComandas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comandas")
      .select("*, comanda_itens!comanda_itens_comanda_id_fkey(*)")
      .eq("paga", false)
      .order("created_at", { ascending: false });

    if (error) {
      message.error("Erro ao buscar comandas");
    } else {
      setComandas(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComandas();
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
          price: DRINKS_PRICES[newDrink],
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

    message.success("Bebida adicionada");
    setSelectedComanda(null);
    setNewDrink("");
    setQuantity(1);
    fetchComandas();
  };

  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [selectedItemsRecord, setSelectedItemsRecord] = useState<any>(null);

  const comandasWithTotals = comandas.map((c) => ({
    ...c,
    total: c.comanda_itens.reduce((sum: number, i: any) => sum + i.quantidade * i.preco_unitario, 0),
  }));

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Comandas Abertas</h1>
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comandasWithTotals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma comanda aberta
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
                            setSelectedItemsRecord(record);
                            setItemsModalOpen(true);
                          }}
                        >
                          {totalQtd} bebida(s)
                        </Button>
                      </TableCell>
                      <TableCell>R$ {record.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setSelectedComanda(record)}>
                            Adicionar bebida
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setPayingComandaId(record.id);
                              fetchAdmins();
                              setPayModalVisible(true);
                            }}
                          >
                            Marcar como paga
                          </Button>
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
      <Dialog open={!!selectedComanda} onOpenChange={(open) => !open && setSelectedComanda(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Adicionar bebida à comanda de {selectedComanda?.nome_convidado}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(DRINKS_PRICES).map(([drink, price]) => (
                <Button
                  key={drink}
                  variant={newDrink === drink ? "default" : "outline"}
                  onClick={() => setNewDrink(drink)}
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
              onChange={(val) => setQuantity(val ?? 1)}
              placeholder="Quantidade"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedComanda(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAddDrink}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemsModalOpen} onOpenChange={setItemsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Itens da comanda de {selectedItemsRecord?.nome_convidado}</DialogTitle>
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
            <Button onClick={() => setItemsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payModalVisible} onOpenChange={(open) => {
        if (!open) {
          setPayModalVisible(false);
          setSelectedAdmin(null);
          setAdminPassword("");
          setPayingComandaId(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pagamento da comanda</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Select value={selectedAdmin || ""} onValueChange={(value) => setSelectedAdmin(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o administrador" />
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
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Senha do admin"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPayModalVisible(false);
              setSelectedAdmin(null);
              setAdminPassword("");
              setPayingComandaId(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPay}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
})

OpenComandasPageContent.displayName = "OpenComandasPageContent";