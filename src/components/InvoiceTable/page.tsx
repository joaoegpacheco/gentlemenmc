"use client";

import { useEffect } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { message } from "@/lib/message";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/hooks/use-supabase";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { useDeviceSizes } from "@/utils/mediaQueries";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Invoice {
  id: string;
  data_evento: string;
  membros: string[];
  visitantes: string[];
  valor_total: number;
  valor_dividido: number;
  pix: string;
  arquivo_url: string | null;
}

interface Payment {
  nota_id: string;
  user_id: string;
  comprovante_url: string;
  data_pagamento: string;
}

export const InvoiceTable = () => {
  const invoices$ = useObservable<Invoice[]>([]);
  const members$ = useObservable<Record<string, string>>({});
  const loading$ = useObservable(true);
  const selectedImage$ = useObservable<string | null>(null);
  const isPayModalVisible$ = useObservable(false);
  const payingInvoice$ = useObservable<Invoice | null>(null);
  const receiptFile$ = useObservable<File | null>(null);
  const payments$ = useObservable<Payment[]>([]);
  const user$ = useObservable<{ id: string } | null>(null);

  const invoices = useValue(invoices$);
  const members = useValue(members$);
  const loading = useValue(loading$);
  const selectedImage = useValue(selectedImage$);
  const isPayModalVisible = useValue(isPayModalVisible$);
  const payingInvoice = useValue(payingInvoice$);
  const receiptFile = useValue(receiptFile$);
  const payments = useValue(payments$);
  const user = useValue(user$);
  const { isMobile } = useDeviceSizes();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          throw new Error("Usuário não autenticado");
        }
        user$.set(data.user);
      } catch (err) {
        message.error("Erro ao autenticar. Redirecionando para o login.");
        router.push("/login");
      }
    };

    const fetchInvoices = async () => {
      const { data, error } = await supabase.from("notas_fiscais").select("*");
      if (error) {
        message.error("Erro ao carregar notas fiscais");
      } else {
        invoices$.set(data);
      }
    };

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("membros")
        .select("user_id, user_name");
      if (error) {
        message.error("Erro ao carregar membros");
      } else {
        const membersMap = data.reduce(
          (acc: Record<string, string>, member) => {
            acc[member.user_id] = member.user_name;
            return acc;
          },
          {}
        );
        members$.set(membersMap);
      }
    };

    const fetchPayments = async () => {
      const { data, error } = await supabase.from("pagamentos").select("*");
      if (!error && data) payments$.set(data);
    };

    fetchUser();
    fetchInvoices();
    fetchMembers();
    fetchPayments();
    loading$.set(false);
  }, [router]);

  const handlePay = async () => {
    if (!receiptFile || !payingInvoice) return;

    const fileName = `${payingInvoice.id}_${user?.id}_${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from("pagamentos")
      .upload(fileName, receiptFile);

    if (uploadError) {
      message.error("Erro ao fazer upload do comprovante.");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("pagamentos")
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      message.error("Erro ao obter URL pública do comprovante.");
      return;
    }

    const { error: insertError } = await supabase.from("pagamentos").insert([
      {
        nota_id: payingInvoice.id,
        user_id: user?.id,
        comprovante_url: publicUrlData.publicUrl,
        data_pagamento: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      message.error("Erro ao registrar pagamento.");
    } else {
      message.success("Pagamento registrado com sucesso!");
      isPayModalVisible$.set(false);
      receiptFile$.set(null);

      const { data, error } = await supabase.from("pagamentos").select("*");
      if (!error && data) {
        payments$.set(data);
      }
    }
  };

  const userPagou = (invoiceId: string, userId: string) => {
    return payments?.some(
      (p) => p.nota_id === invoiceId && p.user_id === userId
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success("Copiado para a área de transferência!");
      })
      .catch(() => {
        message.error("Falha ao copiar.");
      });
  };


  if (!user) return <p>Carregando...</p>;

  return (
    <div className="max-w-6xl mx-auto w-full">
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : isMobile ? (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="border border-gray-300 p-4 rounded-lg space-y-2"
            >
              <p>
                <strong>Data do Evento:</strong> {formatDate(invoice.data_evento)}
              </p>
              <p>
                <strong>Nomes:</strong>{" "}
                {[
                  ...(invoice.membros?.map((id: string) => {
                    const name: string = members[id] || id;
                    const isPaid: boolean = userPagou(invoice.id, id);
                    return (
                      <span
                        key={id}
                        className={isPaid ? "line-through" : ""}
                      >
                        {name}
                      </span>
                    );
                  }) || []),
                  ...(invoice.visitantes?.map((visitor: string, i: number) => (
                    <span key={`v-${i}`}>{visitor}</span>
                  )) || []),
                ].reduce<JSX.Element[]>((acc, curr, idx, arr) => {
                  acc.push(curr);
                  if (idx < arr.length - 1)
                    acc.push(<span key={`sep-${idx}`}>, </span>);
                  return acc;
                }, [])}
              </p>
              <p>
                <strong>Valor total da Nota:</strong> {formatCurrency(invoice.valor_total)}
              </p>
              <p>
                <strong>Valor por Pessoa:</strong> {formatCurrency(invoice.valor_dividido)}
              </p>
              <p>
                <strong>PIX:</strong>{" "}
                <span
                  className="cursor-pointer text-blue-600"
                  onClick={() => invoice.pix && copyToClipboard(invoice.pix)}
                >
                  {invoice.pix || "-"}
                </span>
              </p>
              {invoice.arquivo_url && (
                <Image
                  src={invoice.arquivo_url}
                  alt="Nota Fiscal"
                  width={100}
                  height={100}
                  className="object-cover cursor-pointer"
                  onClick={() => selectedImage$.set(invoice.arquivo_url)}
                />
              )}
              <div className="text-center">
                <Button
                  onClick={() => {
                    payingInvoice$.set(invoice);
                    isPayModalVisible$.set(true);
                  }}
                >
                  Pagar
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data do Evento</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Valor total da Nota</TableHead>
                <TableHead>Valor por Pessoa</TableHead>
                <TableHead>PIX para Pagamento</TableHead>
                <TableHead>Nota Fiscal</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{formatDate(invoice.data_evento)}</TableCell>
                  <TableCell>
                    {[
                      ...(invoice.membros?.map((id: string) => {
                        const name: string = members[id] || id;
                        const isPaid: boolean = userPagou(invoice.id, id);
                        return (
                          <span
                            key={id}
                            className={isPaid ? "line-through" : ""}
                          >
                            {name}
                          </span>
                        );
                      }) || []),
                      ...(invoice.visitantes?.map((visitor: string, i: number) => (
                        <span key={`v-${i}`}>{visitor}</span>
                      )) || []),
                    ].reduce<JSX.Element[]>((acc, curr, idx, arr) => {
                      acc.push(curr);
                      if (idx < arr.length - 1)
                        acc.push(<span key={`sep-${idx}`}>, </span>);
                      return acc;
                    }, [])}
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.valor_total)}</TableCell>
                  <TableCell>{formatCurrency(invoice.valor_dividido)}</TableCell>
                  <TableCell>
                    <span
                      className="cursor-pointer text-blue-600"
                      onClick={() => invoice.pix && copyToClipboard(invoice.pix)}
                    >
                      {invoice.pix || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {invoice.arquivo_url ? (
                      <Image
                        src={invoice.arquivo_url}
                        alt="Nota Fiscal"
                        width={100}
                        height={100}
                        className="object-cover cursor-pointer"
                        onClick={() => selectedImage$.set(invoice.arquivo_url)}
                      />
                    ) : (
                      "Sem imagem"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => {
                        setPayingInvoice(invoice);
                        setIsPayModalVisible(true);
                      }}
                    >
                      Pagar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isPayModalVisible} onOpenChange={isPayModalVisible$.set}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Comprovante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    receiptFile$.set(file);
                  }
                }}
                className="hidden"
                id="receipt-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("receipt-upload")?.click()}
                className="w-full"
              >
                {receiptFile ? receiptFile.name : "Selecionar Comprovante"}
              </Button>
              {receiptFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => receiptFile$.set(null)}
                  className="mt-2"
                >
                  Remover
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => isPayModalVisible$.set(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePay} disabled={!receiptFile}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => selectedImage$.set(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Nota Fiscal</DialogTitle>
            </DialogHeader>
            <Image
              src={selectedImage}
              alt="Nota Fiscal"
              width={800}
              height={800}
              className="object-contain w-full"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
