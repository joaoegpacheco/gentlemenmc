"use client";

import { useState, useEffect } from "react";
import { Input, Button, Select, Table, message, Upload, DatePicker } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { supabase } from "@/hooks/use-supabase";
import { formatCurrency } from "@/utils/formatCurrency";
import Image from 'next/image';
import dayjs from 'dayjs'; // Para manipulação da data

export const InvoiceForm = () => {
  const [members, setMembers] = useState<{ user_id: string; user_name: string }[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState<number | undefined>();
  const [pix, setPix] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Estado para visitantes
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [visitorNames, setVisitorNames] = useState<string[]>([]);
  
  // Estado para data do evento
  const [eventDate, setEventDate] = useState<dayjs.Dayjs | null>(null);

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

  // Atualiza os nomes dos visitantes quando a quantidade muda
  useEffect(() => {
    setVisitorNames(Array(visitorCount).fill(""));
  }, [visitorCount]);

  const handleSave = async () => {
    if (!totalAmount || selectedMembers.length === 0 || !file || !eventDate) {
      message.error("Preencha todos os campos corretamente.");
      return;
    }
    setLoading(true);

    // Número total de participantes (membros + visitantes, se houver)
    const totalParticipants = selectedMembers.length + (visitorCount > 0 ? visitorCount : 0);
    const dividedAmount = totalAmount / totalParticipants;

    const user = await supabase.auth.getUser();
    if (!user) {
      message.error("Usuário não autenticado.");
      return;
    }

    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError || !buckets.some((b) => b.name === "notas_fiscais")) {
      message.error('Bucket "notas_fiscais" não encontrado. Verifique o Supabase.');
      setLoading(false);
      return;
    }

    const sanitizedFileName = file.name.replace(/\s+/g, "_");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("notas_fiscais")
      .upload(`${sanitizedFileName}`, file);

    if (uploadError) {
      message.error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
      setLoading(false);
      return;
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/notas_fiscais/${uploadData.path}`;

    // Monta os dados para inserir no Supabase
    const insertData: any = {
      valor_total: totalAmount,
      membros: selectedMembers,
      valor_dividido: dividedAmount,
      arquivo_url: fileUrl,
      pix,
      data_evento: eventDate.format("YYYY-MM-DD"), // Formato de data no banco de dados
    };

    // Se houver visitantes, adiciona os campos na requisição
    if (visitorCount > 0) {
      insertData.quantidade_visitantes = visitorCount;
      insertData.visitantes = visitorNames;
    }

    // Insere os dados no banco
    const { error } = await supabase.from("notas_fiscais").insert([insertData]);

    if (error) {
      message.error("Erro ao salvar nota fiscal");
    } else {
      message.success("Nota fiscal salva com sucesso");
      setTotalAmount(undefined);
      setPix(undefined);
      setSelectedMembers([]);
      setVisitorCount(0);
      setVisitorNames([]);
      setFile(null);
      setEventDate(null); // Limpar a data após o envio
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

      {/* Campo para data do evento */}
      <DatePicker
        value={eventDate}
        onChange={(date) => setEventDate(date)}
        format="DD/MM/YYYY"
        style={{ width: "100%", marginBottom: 10 }}
      />

      {/* Campo para quantidade de visitantes */}
      <Select
        placeholder="Adicionar visitantes"
        style={{ width: "100%", marginBottom: 10 }}
        value={visitorCount}
        onChange={setVisitorCount}
      >
        {[...Array(11)].map((_, i) => (
          <Select.Option key={i} value={i}>
            {i === 0 ? "Se houver visitante, adicione a quantidade" : `${i} visitante${i > 1 ? "s" : ""}`}
          </Select.Option>
        ))}
      </Select>

      {/* Campos de nome para visitantes */}
      {visitorCount > 0 &&
        visitorNames.map((_, index) => (
          <Input
            key={index}
            placeholder={`Nome do visitante ${index + 1}`}
            value={visitorNames[index]}
            onChange={(e) => {
              const newNames = [...visitorNames];
              newNames[index] = e.target.value;
              setVisitorNames(newNames);
            }}
            style={{ marginBottom: 10, width: "100%" }}
          />
        ))}

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
          return false;
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

      <Table
        dataSource={[
          ...selectedMembers.map((id) => {
            const member = members.find((m) => m.user_id === id);
            return {
              key: id,
              nome: member?.user_name,
              valor: formatCurrency((totalAmount || 0) / (selectedMembers.length + visitorCount)),
            };
          }),
          ...(visitorCount > 0
            ? visitorNames.map((name, index) => ({
                key: `visitor-${index}`,
                nome: name || `Visitante ${index + 1}`,
                valor: formatCurrency((totalAmount || 0) / (selectedMembers.length + visitorCount)),
              }))
            : []),
        ]}
        columns={[
          { title: "Membro/Visitante", dataIndex: "nome", key: "nome" },
          { title: "Valor", dataIndex: "valor", key: "valor" },
        ]}
        pagination={false}
        style={{ width: "100%", marginTop: 10 }}
      />

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
