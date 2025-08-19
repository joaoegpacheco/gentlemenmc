"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button, Input, InputNumber, Table, message, Typography, Tag, Select, Modal, Form } from "antd";
import { addOrUpdateEstoque, getEstoque } from "@/services/estoqueService";
import { BEBIDAS_PRECOS } from "@/constants/drinks";

type EstoqueType = {
  id: string;
  drink: string;
  quantity: number;
};

const LOW_STOCK_THRESHOLD = 5;

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<EstoqueType[]>([]);
  const [drink, setDrink] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Estado para edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EstoqueType | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  async function fetchEstoque() {
    try {
      const data = await getEstoque();
      setEstoque(data);
    } catch {
      message.error("Erro ao buscar estoque");
    }
  }

  useEffect(() => {
    fetchEstoque();
  }, []);

  const handleAdd = async () => {
    if (!drink || quantity <= 0) {
      message.error("Informe o nome da bebida e quantidade válida");
      return;
    }

    setLoading(true);
    try {
      await addOrUpdateEstoque(drink.trim(), quantity);
      message.success("Estoque atualizado!");
      setDrink("");
      setQuantity(1);
      await fetchEstoque();
    } catch {
      message.error("Erro ao atualizar estoque");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: EstoqueType) => {
    setEditingItem(item);
    setEditQuantity(item.quantity);
    setIsModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    if (editQuantity < 0) {
      message.error("Quantidade não pode ser negativa");
      return;
    }

    setLoading(true);
    try {
      // diferença entre valor novo e o atual
      const diff = editQuantity - editingItem.quantity;

      if (diff !== 0) {
        await addOrUpdateEstoque(editingItem.drink, diff);
      }

      message.success("Quantidade atualizada!");
      setIsModalOpen(false);
      setEditingItem(null);
      await fetchEstoque();
    } catch {
      message.error("Erro ao salvar edição");
    } finally {
      setLoading(false);
    }
  };

  const filteredEstoque = useMemo(() => {
    return estoque
      .filter((item) =>
        item.drink.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.drink.localeCompare(b.drink));
  }, [estoque, search]);

  const bebidasOptions = Object.keys(BEBIDAS_PRECOS).map((name) => ({
    label: name,
    value: name,
  }));

  return (
    <div style={{ padding: 15 }} className="p-6 max-w-4xl mx-auto">
      <Typography.Title level={2}>📦 Controle de Estoque</Typography.Title>

      {/* Formulário de Adição */}
      <div style={{ marginBottom: 15 }} className="border p-4 rounded-xl shadow-sm mb-6 bg-white">
        <Typography.Title level={4}>Adicionar ou atualizar bebida</Typography.Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }} className="flex flex-col md:flex-row gap-4">
          <Select
            placeholder="Selecione uma bebida"
            value={drink || undefined}
            onChange={setDrink}
            options={bebidasOptions}
          />
          <InputNumber
            min={1}
            value={quantity}
            onChange={(v) => setQuantity(Number(v))}
            style={{ width: "100%" }}
            className="w-full md:w-32"
          />
          <Button type="primary" loading={loading} onClick={handleAdd}>
            Adicionar ao estoque
          </Button>
        </div>
      </div>

      {/* Campo de busca */}
      <div className="mb-4">
        <Input.Search
          placeholder="Buscar bebida no estoque"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          enterButton
        />
      </div>

      {/* Tabela de estoque */}
      <Table
        dataSource={filteredEstoque.map((item) => ({ ...item, key: item.id }))}
        pagination={{ pageSize: 10 }}
        columns={[
          {
            title: "Bebida",
            dataIndex: "drink",
            sorter: (a, b) => a.drink.localeCompare(b.drink),
          },
          {
            title: "Quantidade",
            dataIndex: "quantity",
            sorter: (a, b) => a.quantity - b.quantity,
            render: (value: number) =>
              value <= LOW_STOCK_THRESHOLD ? (
                <Tag color="red">{value} 🔻</Tag>
              ) : (
                <Tag color="green">{value}</Tag>
              ),
          },
          {
            title: "Ações",
            render: (_, record: EstoqueType) => (
              <Button type="link" onClick={() => handleEdit(record)}>
                Editar
              </Button>
            ),
          },
        ]}
      />

      {/* Modal de Edição */}
      <Modal
        title={`Editar estoque - ${editingItem?.drink}`}
        open={isModalOpen}
        onOk={handleSaveEdit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form layout="vertical">
          <Form.Item label="Quantidade">
            <InputNumber
              min={0}
              value={editQuantity}
              onChange={(v) => setEditQuantity(Number(v))}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
