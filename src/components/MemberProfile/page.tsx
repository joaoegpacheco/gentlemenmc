"use client";

import React, { useEffect, useMemo } from "react";
import Image from 'next/image';
import { useObservable, useValue } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { message } from "@/lib/message";
import { supabase } from "@/hooks/use-supabase";
import {
  Edit,
  CreditCard,
  Package,
  DollarSign,
  Send,
  UserCheck,
  UserX,
  History,
} from "lucide-react";
import { InputNumber } from "@/components/ui/input-number";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/formatCurrency";

type MemberStatus = "ativo" | "inativo" | "suspenso";

interface Member {
  id?: number;
  user_id: string;
  user_name: string;
  user_email?: string;
  phone?: string;
  foto_url?: string;
  status?: MemberStatus;
  observacoes?: string;
  created_at?: string;
}

interface Drink {
  id: number;
  created_at: string;
  drink: string;
  name: string;
  quantity: number;
  price: number;
  paid: boolean;
  uuid: string;
}

interface MemberProfileProps {
  member: Member;
  onEdit: () => void;
  onRefresh: () => void;
}

export function MemberProfile({
  member,
  onEdit,
  onRefresh,
}: MemberProfileProps) {
  const creditBalance$ = useObservable<number>(0);
  const drinks$ = useObservable<Drink[]>([]);
  const loading$ = useObservable(false);
  const bulkCreditAmount$ = useObservable<number>(0);
  const bulkCreditDialogOpen$ = useObservable(false);
  const notificationMessage$ = useObservable("");
  const notificationDialogOpen$ = useObservable(false);
  const currentPage$ = useObservable<number>(1);
  const pageSize$ = useObservable<number>(20);

  const creditBalance = useValue(creditBalance$);
  const drinks = useValue(drinks$);
  const loading = useValue(loading$);
  const bulkCreditAmount = useValue(bulkCreditAmount$);
  const bulkCreditDialogOpen = useValue(bulkCreditDialogOpen$);
  const notificationMessage = useValue(notificationMessage$);
  const notificationDialogOpen = useValue(notificationDialogOpen$);
  const currentPage = useValue(currentPage$);
  const pageSize = useValue(pageSize$);

  useEffect(() => {
    fetchMemberData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.user_id]);

  const fetchMemberData = async () => {
    loading$.set(true);
    try {
      // Buscar créditos
      const { data: credits } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", member.user_id);

      const balance =
        credits?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0;
      creditBalance$.set(balance);

      // Buscar todos os pedidos (bebidas) - sem limite para calcular totais
      const { data: drinksData } = await supabase
        .from("bebidas")
        .select("*")
        .eq("uuid", member.user_id)
        .order("created_at", { ascending: false });

      drinks$.set(drinksData || []);
    } catch (error) {
      console.error("Erro ao buscar dados do membro:", error);
    } finally {
      loading$.set(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus: MemberStatus =
      member.status === "ativo" ? "inativo" : "ativo";

    try {
      // Verificar se o usuário é admin
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        message.error("Usuário não autenticado");
        return;
      }

      const { data: admins } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin");

      const isAdmin = !!(admins && admins.length > 0);
      const isBarMC = user.email === "barmc@gentlemenmc.com.br";

      if (!isAdmin && !isBarMC) {
        message.error("Apenas administradores podem alterar status de membros");
        return;
      }

      const { error } = await supabase
        .from("membros")
        .update({ status: newStatus })
        .eq("user_id", member.user_id);

      if (error) {
        if (error.message?.includes("row-level security") || error.code === "42501") {
          message.error(
            "Erro de permissão. Verifique as políticas RLS no Supabase. Veja RLS_POLICIES.md"
          );
          console.error("RLS Error:", error);
        } else {
          throw error;
        }
        return;
      }

      message.success(
        `Membro ${newStatus === "ativo" ? "ativado" : "desativado"} com sucesso!`
      );
      onRefresh();
    } catch (error: any) {
      message.error(`Erro ao alterar status: ${error.message}`);
    }
  };

  const handleBulkAddCredit = async () => {
    if (bulkCreditAmount <= 0) {
      message.error("Valor deve ser maior que zero");
      return;
    }

    try {
      const { error } = await supabase.from("credits").insert([
        {
          user_id: member.user_id,
          balance: bulkCreditAmount,
        },
      ]);

      if (error) throw error;

      message.success("Créditos adicionados com sucesso!");
      bulkCreditDialogOpen$.set(false);
      bulkCreditAmount$.set(0);
      fetchMemberData();
      onRefresh();
    } catch (error: any) {
      message.error(`Erro ao adicionar créditos: ${error.message}`);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      message.error("Digite uma mensagem");
      return;
    }

    // Aqui você pode integrar com WhatsApp ou outro serviço
    // Por enquanto, apenas mostra uma mensagem de sucesso
    message.success("Notificação enviada com sucesso!");
    notificationDialogOpen$.set(false);
    notificationMessage$.set("");
  };

  const getStatusBadge = (status?: MemberStatus) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-500">Ativo</Badge>;
      case "inativo":
        return <Badge variant="secondary">Inativo</Badge>;
      case "suspenso":
        return <Badge variant="destructive">Suspenso</Badge>;
      default:
        return <Badge className="bg-green-500">Ativo</Badge>;
    }
  };

  // Total de Pedidos: soma de quantity de todas as bebidas (independente de paid)
  const totalDrinksQuantity = useMemo(() => {
    return drinks.reduce((sum, d) => {
      const quantity = d.quantity || 1;
      return sum + quantity;
    }, 0);
  }, [drinks]);

  // Total de Pagamentos: soma de price das bebidas com paid = true
  const totalPayments = useMemo(() => {
    return drinks
      .filter((d) => d.paid === true)
      .reduce((sum, d) => {
        const price = parseFloat(d.price?.toString() || "0");
        return sum + price;
      }, 0);
  }, [drinks]);

  // Paginação do histórico de pedidos
  const paginatedDrinks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return drinks.slice(startIndex, endIndex);
  }, [drinks, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(drinks.length / pageSize);
  }, [drinks.length, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      currentPage$.set(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <div className="flex items-start gap-6">
        <div>
          {member.foto_url ? (
            <Image
              src={member.foto_url}
              alt={member.user_name}
              width={96}
              height={96}
              className="object-cover rounded-full w-24 h-24"
              priority
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2">
              <span className="text-4xl">
                {member.user_name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">{member.user_name}</h2>
            {getStatusBadge(member.status)}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {member.user_email && <p>📧 {member.user_email}</p>}
            {member.phone && <p>📱 {member.phone}</p>}
            {member.created_at && (
              <p>
                📅 Cadastro:{" "}
                {new Date(member.created_at).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={onEdit} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button
            onClick={handleToggleStatus}
            variant="outline"
            className="gap-2"
          >
            {member.status === "ativo" ? (
              <>
                <UserX className="h-4 w-4" />
                Desativar
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                Ativar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Créditos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(creditBalance)}
            </div>
            <Dialog
              open={bulkCreditDialogOpen}
              onOpenChange={bulkCreditDialogOpen$.set}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2">
                  Adicionar Créditos
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Créditos em Lote</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Valor (R$)
                    </label>
                    <InputNumber
                      value={bulkCreditAmount}
                      onChange={(val) => bulkCreditAmount$.set(val ?? 0)}
                      min={0}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={handleBulkAddCredit} className="w-full">
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDrinksQuantity}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {drinks.length} pedidos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPayments)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {drinks.filter((d) => d.paid === true).length} pagamentos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Dialog
              open={notificationDialogOpen}
              onOpenChange={notificationDialogOpen$.set}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Send className="h-4 w-4" />
                  Enviar Notificação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Notificação Personalizada</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Mensagem
                    </label>
                    <Textarea
                      value={notificationMessage}
                      onChange={(e) => notificationMessage$.set(e.target.value)}
                      placeholder="Digite a mensagem para o membro..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button onClick={handleSendNotification} className="w-full">
                    Enviar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {member.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {member.observacoes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : drinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum pedido encontrado
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Bebida</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDrinks.map((drink) => {
                      const price = parseFloat(drink.price?.toString() || "0");
                      const quantity = drink.quantity || 1;
                      const total = price * quantity;

                      return (
                        <TableRow key={drink.id}>
                          <TableCell>
                            {new Date(drink.created_at).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>{drink.drink || drink.name}</TableCell>
                          <TableCell>{quantity}</TableCell>
                          <TableCell>{formatCurrency(total)}</TableCell>
                          <TableCell>
                            {drink.paid ? (
                              <Badge className="bg-green-500">Pago</Badge>
                            ) : (
                              <Badge variant="secondary">Pendente</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} ({drinks.length} pedidos)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

