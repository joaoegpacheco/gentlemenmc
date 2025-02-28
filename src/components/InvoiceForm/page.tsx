"use client";

import { useState, useEffect } from "react";
import { Input, Button, Select, Table, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { supabase } from "@/hooks/use-supabase";
import { formatCurrency } from "@/utils/formatCurrency";
import Image from 'next/image';

export const InvoiceForm = () => {
  const [members, setMembers] = useState<
    { user_id: string; user_name: string }[]
  >([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState<number | undefined>();
  const [pix, setPix] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("membros")
        .select("id, user_id, user_name");
      if (error) {
        message.error("Erro ao carregar membros");
      } else {
        setMembers(data);
      }
    };
    fetchMembers();
  }, []);

  const handleSave = async () => {
    if (!totalAmount || selectedMembers.length === 0 || !file) {
      message.error("Preencha todos os campos corretamente.");
      return;
    }
    setLoading(true);
    const dividedAmount = totalAmount / selectedMembers.length;

    // Verifica se o usuário está autenticado
    const user = supabase.auth.getUser();
    if (!user) {
      message.error("Usuário não autenticado.");
      return;
    }

    // Verifica se o bucket realmente existe
    const { data: buckets, error: bucketError } =
    await supabase.storage.listBuckets();
    if (bucketError || !buckets.some((b) => b.name === "notas_fiscais")) {
      message.error(
        'Bucket "notas_fiscais" não encontrado. Verifique o Supabase.'
      );
      setLoading(false);
      return;
    }

    // Substitui espaços e caracteres inválidos no nome do arquivo
    const sanitizedFileName = file.name.replace(/\s+/g, "_");

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("notas_fiscais")
      .upload(`${sanitizedFileName}`, file);

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError.message);
      message.error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
      setLoading(false);
      return;
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/notas_fiscais/${uploadData.path}`;

    // Insere os dados no banco
    const { error } = await supabase.from("notas_fiscais").insert([
      {
        valor_total: totalAmount,
        membros: selectedMembers,
        valor_dividido: dividedAmount,
        arquivo_url: fileUrl,
        pix
      },
    ]);

    if (error) {
      message.error("Erro ao salvar nota fiscal");
    } else {
      message.success("Nota fiscal salva com sucesso");
      setTotalAmount(undefined);
      setPix(undefined);
      setSelectedMembers([]);
      setFile(null); // Apaga o arquivo após sucesso
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", width: "100%" }}>
      <Input
        type="number"
        placeholder="Valor total"
        value={totalAmount}
        onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
        style={{ marginBottom: 10, width: "100%" }}
      />
      <Select
        mode="multiple"
        placeholder="Selecione os membros"
        style={{ width: "100%", marginBottom: 10 }}
        value={selectedMembers}
        onChange={setSelectedMembers}
      >
        {members.map((member) => (
          <Select.Option key={member.user_id} value={member.user_id}>
            {member.user_name}
          </Select.Option>
        ))}
      </Select>
      <Input
        type="text"
        placeholder="PIX para pagamento"
        value={pix}
        onChange={(e) => setPix(e.target.value)}
        style={{ marginBottom: 10, width: "100%" }}
      />
      <Upload
        beforeUpload={(file) => {
          setFile(file);
          return false; // Impede o upload automático
        }}
        fileList={file ? [{ uid: "-1", name: file.name, status: "done" }] : []}
        onRemove={() => setFile(null)}
        showUploadList={{ showRemoveIcon: true }}
        style={{ width: "100%" }}
      >
        <Button icon={<UploadOutlined />} style={{ width: "100%" }}>
          Selecionar Nota Fiscal
        </Button>
      </Upload>
      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <Table
          dataSource={selectedMembers.map((id) => {
            const member = members.find((m) => m.user_id === id);
            return {
              key: id,
              nome: member?.user_name,
              valor: formatCurrency((totalAmount || 0) / selectedMembers.length),
            };
          })}
          columns={[
            { title: "Membro", dataIndex: "nome", key: "nome" },
            { title: "Valor", dataIndex: "valor", key: "valor" },
          ]}
          locale={{
            emptyText: (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <Image
                  src="/images/gentlemenmc.png"
                  alt="Logo Gentlemen MC"
                  width={200}
                  height={200}
                  style={{
                    objectFit: "contain", // Garante que a imagem não distorça
                  }}
                />
                <span style={{ fontSize: 16, color: "#888" }}>Nenhum membro selecionado</span>
              </div>
            ),
          }}
          pagination={false}
          style={{ width: "100%" }}
        />
      </div>
      <Button
        type="primary"
        onClick={handleSave}
        loading={loading}
        style={{ marginTop: 10, width: "100%" }}
      >
        Salvar Nota Fiscal
      </Button>
    </div>
  );
};
