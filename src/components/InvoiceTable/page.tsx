"use client";

import { useState, useEffect } from "react";
import { Table, message, Modal } from "antd";
import { supabase } from "@/hooks/use-supabase";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { useDeviceSizes } from "@/utils/mediaQueries";
import Image from "next/image";

export const InvoiceTable = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [members, setMembers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { isMobile } = useDeviceSizes();

  useEffect(() => {
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
    fetchInvoices();
    fetchMembers();
    setLoading(false);
  }, []);

  const totalAmount = invoices.reduce(
    (sum, invoice) => sum + (invoice.valor_total || 0),
    0
  );

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
      render: (membros: string[], record: any) => {
        const memberNames = membros?.map((id) => members[id] || id) || [];
        const visitorNames = record.visitantes || [];
        return [...memberNames, ...visitorNames].join(", ") || "-";
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
    },
    {
      title: "Imagem da Nota Fiscal",
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
  ];

  return (
    <div style={{ maxWidth: 800, margin: "auto", width: "100%" }}>
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
                <strong>Data do Evento:</strong>{" "}
                {formatDate(invoice.data_evento)}
              </p>
              <p>
                <strong>Nomes:</strong>{" "}
                {[
                  ...(invoice.membros?.map(
                    (id: string | number) => members[id] || id
                  ) || []),
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
                <strong>PIX:</strong> {invoice.pix || "-"}
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
        visible={!!selectedImage}
        footer={null}
        onCancel={() => setSelectedImage(null)}
        width={isMobile ? 350 : 650} // Define um tamanho máximo para a modal
      >
        {selectedImage && (
          <Image
            src={selectedImage}
            alt="Nota Fiscal"
            width={isMobile ? 300 : 600}
            height={isMobile ? 300 : 600}
            style={{ objectFit: "contain" }}
          />
        )}
      </Modal>
    </div>
  );
};
