"use client";
import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { List, Card, ConfigProvider, Select } from "antd";
import { formatDateTime } from "@/utils/formatDateTime";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { supabase } from "@/hooks/use-supabase";
import { formatCurrency } from "@/utils/formatCurrency";
import type { PostgrestResponse } from "@supabase/supabase-js";

interface Drink {
  created_at: string;
  name: string;
  drink: string;
  paid: boolean;
  quantity: number;
  price: number;
  user: string;
  uuid: string;
}

interface Member {
  user_id: string;
  user_name: string;
}

interface AdminData {
  id: string;
}

export const CardComand = forwardRef((_, ref) => {
  const [userData, setUserData] = useState<{ id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [drinksData, setDrinksData] = useState<Drink[]>([]);

  const fetchUserData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    setUserData(user);
    if (!user) return;

    // Verifica se é admin
    const { data: admins }: PostgrestResponse<AdminData> = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id);

    const adminStatus = !!(admins && admins.length > 0);
    setIsAdmin(adminStatus);

    if (adminStatus) {
      const { data: membros, error } = await supabase
        .from("membros")
        .select("user_id, user_name")
        .order("user_name", { ascending: true });

      if (!error) {
        setMembers(membros || []);
      }
    }

    setSelectedUUID(user.id);
  };

  const fetchDrinks = async (uuid: string | null) => {
    if (!uuid) return;
    const { data: drinks } = await supabase
      .from("bebidas")
      .select("created_at, name, drink, paid, quantity, price, user, uuid")
      .eq("uuid", uuid)
      .order("created_at", { ascending: false });

    const total =
      drinks?.reduce(
        (sum, { paid, price }) =>
          !paid ? sum + parseFloat(price.toString()) : sum,
        0
      ) || 0;

    setDrinksData(drinks || []);
    setTotalAmount(total);
  };

  useImperativeHandle(ref, () => ({
    refreshData: () => fetchDrinks(selectedUUID),
  }));

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (selectedUUID) {
      fetchDrinks(selectedUUID);
    }
  }, [selectedUUID]);

  return (
    <ConfigProvider
      renderEmpty={() => <div>Nenhuma bebida marcada em seu nome.</div>}
    >
      {isAdmin && (
        <div style={{ marginBottom: 16 }}>
          <Select
            showSearch
            placeholder="Filtrar por usuário"
            optionFilterProp="children"
            onChange={(value) => setSelectedUUID(value)}
            style={{ width: 300 }}
            value={selectedUUID || undefined}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={members.map((m) => ({
              value: m.user_id,
              label: m.user_name,
            }))}
          />
        </div>
      )}
      <List
        header={
          userData ? `Total não pago: ${formatCurrency(totalAmount)}` : null
        }
        size="small"
        bordered
        dataSource={drinksData}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 4, xl: 4, xxl: 3 }}
        renderItem={(item) => (
          <List.Item key={item.created_at + item.drink}>
            <Card title={item.drink}>
              <p>Data: {formatDateTime(item.created_at)}</p>
              <p>Quantidade: {item.quantity}</p>
              <p>Valor: {formatCurrency(item.price)}</p>
              <p>
                Pago?{" "}
                {item.paid ? (
                  <CheckOutlined style={{ color: "green" }} />
                ) : (
                  <CloseOutlined style={{ color: "red" }} />
                )}
              </p>
              {item.user && <p>Marcado por: {item.user}</p>}
            </Card>
          </List.Item>
        )}
      />
    </ConfigProvider>
  );
});

CardComand.displayName = "CardComand";
