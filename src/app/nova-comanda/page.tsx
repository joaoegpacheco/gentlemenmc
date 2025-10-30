"use client";

import React, { useState } from "react";
import { Button, Table, message, Input } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { registerComanda } from "@/services/comandaService";
import { DRINKS_PRICES } from "@/constants/drinks";
import { consumirEstoque } from "@/services/estoqueService";

export default function CreateComandaPage() {
  const [items, setItems] = useState<{ drink: string; quantity: number; price: number }[]>([]);
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");

  const handleCreateComanda = async () => {
    if (!guestName) {
      message.error("Informe nome do convidado");
      return;
    }
    
    if (items.length === 0) {
      message.error("Adicione ao menos 1 item");
      return;
    }

    for (const item of items) {
      await consumirEstoque(item.drink, item.quantity);
    }

    await registerComanda({
      guestName: guestName || undefined,
      guestPhone: guestPhone || undefined,
      items,
    });

    message.success("Comanda criada com sucesso");

    if (typeof window !== "undefined") {
      const { printComandaHTML } = await import("@/utils-client/printComandaHTML");
      await printComandaHTML({ guestName: guestName || "Sem nome", items });
    }

    setItems([]);
    setGuestName("");
    setGuestPhone("");
  };

  const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return (
    <div className="p-4 flex flex-col gap-25">
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input
          addonBefore="Nome do convidado"
          placeholder="Falano de tal"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />
        <Input
          addonBefore="Telefone do convidado"
          placeholder="(XX) 9XXXX-XXXX"
          value={guestPhone}
          maxLength={15}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            const formatted = raw.replace(
              /^(\d{2})(\d{5})(\d{4}).*/,
              "($1) $2-$3"
            );
            e.target.value = formatted
            setGuestPhone(formatted);
          }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: "wrap", gap: 25, padding: 25 }} className=" grid-cols-2 sm:grid-cols-3 md:grid-cols-4 mb-6">
        {Object.entries(DRINKS_PRICES).map(([drink, price]) => (
          <Button
            key={drink}
            size="large"
            className="h-24 text-lg whitespace-pre-wrap flex flex-wrap gap-[25px]"
            type="default"
            onClick={() => {
              const exists = items.find((i) => i.drink === drink);
              if (exists) {
                setItems((old) =>
                  old.map((i) =>
                    i.drink === drink ? { ...i, quantity: i.quantity + 1 } : i
                  )
                );
              } else {
                setItems((old) => [...old, { drink, quantity: 1, price }]);
              }
            }}
          >
            {drink}
            <br />
            <span className="text-sm">R$ {price.toFixed(2)}</span>
          </Button>
        ))}
      </div>

      <Table
        size="small"
        dataSource={items.map((item, idx) => ({ ...item, key: idx }))}
        pagination={false}
        className="mb-4"
        columns={[
          { title: "Bebida", dataIndex: "drink" },
          { title: "Qtd", dataIndex: "quantity" },
          {
            title: "Preço",
            render: (_, record) => `R$ ${(record.price * record.quantity).toFixed(2)}`,
          },
          {
            title: "",
            render: (_, record) => (
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setItems((old) => old.filter((i) => i.drink !== record.drink))}
              />
            ),
          },
        ]}
      />

      <div className="flex justify-between items-center">
        <div style={{ margin: 25 }} className="text-xl font-bold">Total: R$ {total.toFixed(2)}</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateComanda}>
          Criar Comanda
        </Button>
      </div>
    </div>
  );
}
