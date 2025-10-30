"use client";

import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Button, Modal, Table, message, Select, InputNumber, Input } from "antd";
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

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Comandas Abertas</h1>
      <Table
        dataSource={comandas.map((c) => ({
          key: c.id,
          ...c,
          total: c.comanda_itens.reduce((sum: number, i: any) => sum + i.quantidade * i.preco_unitario, 0),
        }))}
        loading={loading}
        columns={[
          { title: "Nome", dataIndex: "nome_convidado" },
          {
            title: "Telefone",
            dataIndex: "telefone_convidado",
            render: (text) => <span>{text}</span>,
          },
          {
            title: "Itens",
            render: (_, record) => {
              const totalQtd = record.comanda_itens.reduce(
                (sum: number, i: any) => sum + i.quantidade,
                0
              );
              return (
                <Button
                  type="link"
                  onClick={() => {
                    Modal.info({
                      title: `Itens da comanda de ${record.nome_convidado}`,
                      width: 400,
                      content: (
                        <div className="flex flex-col gap-2 mt-2">
                          {record.comanda_itens.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between border-b border-gray-300 pb-1"
                            >
                              <span>{item.bebida_nome}</span>
                              <span>
                                {" "}{item.quantidade} x R${" "}
                                {item.preco_unitario.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ),
                      okText: "Fechar",
                    });
                  }}
                >
                  {totalQtd} bebida(s)
                </Button>
              );
            },
          },
          { title: "Total", dataIndex: "total", render: (val) => `R$ ${val.toFixed(2)}` },
          {
            title: "Ações",
            render: (_, record) => (
              <div style={{gap: 20, display: "flex"}} className="flex gap-2">
                <Button type="default" onClick={() => setSelectedComanda(record)}>
                  Adicionar bebida
                </Button>
                <Button
                  danger
                  onClick={() => {
                    setPayingComandaId(record.id);
                    fetchAdmins(); // <-- busca os admins
                    setPayModalVisible(true);
                  }}
                >
                  Marcar como paga
                </Button>
              </div>
            ),
          },
        ]}
      />
      <Modal
        open={!!selectedComanda}
        onCancel={() => setSelectedComanda(null)}
        onOk={handleAddDrink}
        title={`Adicionar bebida à comanda de ${selectedComanda?.nome_convidado}`}
        width={1200}
      >
        <div className="flex flex-col gap-4">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 25, marginBottom: 20 }}>
            {Object.entries(DRINKS_PRICES).map(([drink, price]) => (
              <Button
                key={drink}
                type={newDrink === drink ? "primary" : "default"}
                onClick={() => setNewDrink(drink)}
                style={{ minWidth: 120, height: 64, whiteSpace: "pre-wrap" }}
              >
                {drink}
                <br />
                <span style={{ fontSize: 12 }}>R$ {price.toFixed(2)}</span>
              </Button>
            ))}
          </div>
          <InputNumber
            min={1}
            value={quantity}
            onChange={(val) => setQuantity(val || 1)}
            placeholder="Quantidade"
          />
        </div>
      </Modal>
      <Modal
        title="Confirmar pagamento da comanda"
        open={payModalVisible}
        onCancel={() => {
          setPayModalVisible(false);
          setSelectedAdmin(null);
          setAdminPassword("");
          setPayingComandaId(null);
        }}
        onOk={handleConfirmPay}
        okText="Confirmar"
        cancelText="Cancelar"
      >
        <div style={{display: "flex", flexDirection: "column", gap: 15}} className="flex flex-col gap-4">
          <Select
            placeholder="Selecione o administrador"
            value={selectedAdmin || undefined}
            onChange={(value) => setSelectedAdmin(value)}
          >
            {adminsList.map((admin) => (
              <Select.Option key={admin.id} value={admin.email}>
                {admin.email}
              </Select.Option>
            ))}
          </Select>
          <Input.Password
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Senha do admin"
          />
        </div>
      </Modal>
    </div>
  );
})

OpenComandasPageContent.displayName = "OpenComandasPageContent";