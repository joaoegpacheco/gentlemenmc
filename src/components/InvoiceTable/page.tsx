"use client";

import { useState, useEffect } from "react";
import { Table, message, Modal, Button, Upload } from "antd";
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [members, setMembers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPayModalVisible, setIsPayModalVisible] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const { isMobile } = useDeviceSizes();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          throw new Error("Usuário não autenticado");
        }
        setUser(data.user);
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
        setInvoices(data);
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
        setMembers(membersMap);
      }
    };

    const fetchPayments = async () => {
      const { data, error } = await supabase.from("pagamentos").select("*");
      if (!error && data) setPayments(data);
    };

    fetchUser();
    fetchInvoices();
    fetchMembers();
    fetchPayments();
    setLoading(false);
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
      setIsPayModalVisible(false);
      setReceiptFile(null);

      const { data, error } = await supabase.from("pagamentos").select("*");
      if (!error && data) {
        setPayments(data);
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

  const columns = [
    {
      title: "Data do Evento",
      dataIndex: "data_evento",
      key: "data_evento",
      width: 250,
      render: (value: string) => formatDate(value),
    },
    {
      title: "Nome",
      dataIndex: "membros",
      key: "membros",
      width: 350,
      render: (membros: string[], record: Invoice) => {
        const memberNames =
          membros?.map((id) => {
            const name = members[id] || id;
            return userPagou(record.id, id) ? (
              <span key={id} style={{ textDecoration: "line-through" }}>
                {name}
              </span>
            ) : (
              <span key={id}>{name}</span>
            );
          }) || [];
        const visitorNames = record.visitantes || [];
        return [...memberNames, ...visitorNames].map((el, i) => (
          <span key={i}>
            {el}
            {i < memberNames.length + visitorNames.length - 1 ? ", " : ""}
          </span>
        ));
      },
    },
    {
      title: "Valor total da Nota",
      dataIndex: "valor_total",
      key: "valor_total",
      width: 150,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Valor por Pessoa",
      dataIndex: "valor_dividido",
      key: "valor_dividido",
      width: 150,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "PIX para Pagamento",
      dataIndex: "pix",
      key: "pix",
      width: 150,
      render: (pix: string) => (
        <span
          style={{ cursor: "pointer", color: "#1890ff" }}
          onClick={() => pix && copyToClipboard(pix)}
        >
          {pix || "-"}
        </span>
      ),
    },
    {
      title: "Nota Fiscal",
      dataIndex: "arquivo_url",
      key: "arquivo_url",
      render: (url: string) =>
        url ? (
          <Image
            src={url}
            alt="Nota Fiscal"
            width={100}
            height={100}
            style={{ objectFit: "cover", cursor: "pointer" }}
            onClick={() => setSelectedImage(url)}
          />
        ) : (
          "Sem imagem"
        ),
    },
    {
      title: "Ações",
      key: "acoes",
      width: 150,
      render: (_: any, record: Invoice) => (
        <Button
          onClick={() => {
            setPayingInvoice(record);
            setIsPayModalVisible(true);
          }}
        >
          Pagar
        </Button>
      ),
    },
  ];

  if (!user) return <p>Carregando...</p>;

  return (
    <div style={{ maxWidth: 1200, margin: "auto", width: "100%" }}>
      {isMobile ? (
        <div>
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              style={{
                border: "1px solid #ddd",
                padding: 10,
                marginBottom: 10,
                borderRadius: 5,
              }}
            >
              <p>
                <strong>Data do Evento:</strong> {formatDate(invoice.data_evento)}
              </p>
              <p>
                <strong>Nomes:</strong>{" "}
                {[
                  ...(invoice.membros?.map((id) => members[id] || id) || []),
                  ...(invoice.visitantes || []),
                ].join(", ")}
              </p>
              <p>
                <strong>Valor total da Nota:</strong>{" "}
                {formatCurrency(invoice.valor_total)}
              </p>
              <p>
                <strong>Valor por Pessoa:</strong>{" "}
                {formatCurrency(invoice.valor_dividido)}
              </p>
              <p>
                <strong>PIX:</strong>{" "}
                <span
                  style={{ cursor: "pointer", color: "#1890ff" }}
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
                  style={{ objectFit: "cover", cursor: "pointer" }}
                  onClick={() => setSelectedImage(invoice.arquivo_url)}
                />
              )}
              <p style={{ textAlign: "center" }}>
                <Button
                  onClick={() => {
                    setPayingInvoice(invoice);
                    setIsPayModalVisible(true);
                  }}
                >
                  Pagar
                </Button>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <Table
          dataSource={invoices}
          columns={columns}
          loading={loading}
          rowKey="id"
        />
      )}
      <Modal
        open={isPayModalVisible}
        onCancel={() => setIsPayModalVisible(false)}
        footer={null}
        title="Enviar Comprovante"
      >
        <Upload
          beforeUpload={(file) => {
            setReceiptFile(file);
            return false;
          }}
          showUploadList={{ showRemoveIcon: true }}
          maxCount={1}
        >
          <Button>Selecionar Comprovante</Button>
        </Upload>
        <Button onClick={handlePay} type="primary" style={{ marginTop: 10 }}>
          Confirmar Pagamento
        </Button>
      </Modal>
    </div>
  );
};