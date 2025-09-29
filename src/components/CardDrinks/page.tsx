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
  const [userData, setUserData] = useState<{ id: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBarMC, setIsBarMC] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [drinksData, setDrinksData] = useState<Drink[]>([]);
  const [todayBR, setTodayBR] = useState<string>("");

  const fetchUserData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    setUserData(user);
    if (!user) return;

    const now = new Date();
    const brToday = now.toLocaleDateString("pt-BR"); // dd/mm/aaaa
    setTodayBR(brToday);

    // Caso seja o email do Bar MC → "admin limitado ao dia atual"
    if (user.email === "barmc@gentlemenmc.com.br") {
      setIsAdmin(true);
      setIsBarMC(true);
      return;
    }

    // Verifica se é admin de verdade
    const { data: admins } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id);

    const adminStatus = !!(admins && admins.length > 0);
    setIsAdmin(adminStatus);

    if (adminStatus) {
      const { data: membros } = await supabase
        .from("membros")
        .select("user_id, user_name")
        .order("user_name", { ascending: true });

      setMembers(membros || []);
    }

    setSelectedUUID(user.id);
  };

  const fetchDrinks = async (uuid: string | null) => {
    let query = supabase
      .from("bebidas")
      .select("created_at, name, drink, paid, quantity, price, user, uuid")
      .order("created_at", { ascending: false });

    if (isBarMC) {
      // Data no fuso de São Paulo (America/Sao_Paulo)
      const formatter = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = formatter.formatToParts(new Date());
      const year = parts.find(p => p.type === "year")?.value;
      const month = parts.find(p => p.type === "month")?.value;
      const day = parts.find(p => p.type === "day")?.value;
      const isoToday = `${year}-${month}-${day}`;

      const startOfDaySP = new Date(`${isoToday}T00:00:00-03:00`);
      const endOfDaySP = new Date(`${isoToday}T23:59:59-03:00`);

      query = query
        .gte("created_at", startOfDaySP.toISOString())
        .lte("created_at", endOfDaySP.toISOString());
    } else if (uuid) {
      // Admin normal ou usuário comum → filtra pelo UUID
      query = query.eq("uuid", uuid);
    }

    const { data: drinks } = await query;

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
    if (isBarMC) {
      fetchDrinks(null); // Busca todos os usuários
    } else if (selectedUUID) {
      fetchDrinks(selectedUUID);
    }
  }, [selectedUUID, isBarMC]);

  return (
    <ConfigProvider
      renderEmpty={() => <div>Nenhuma bebida marcada.</div>}
    >
      {!isBarMC && isAdmin && (
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
          userData
            ? isBarMC
              ? `Bebidas marcadas na data de hoje (${todayBR})`
              : `Total não pago: ${formatCurrency(totalAmount)}`
            : null
        }
        size="small"
        bordered
        dataSource={drinksData}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 4, xl: 4, xxl: 3 }}
        renderItem={(item) => (
          <List.Item key={item.created_at + item.drink}>
            <Card title={isBarMC ? (
              <>
                {item.drink}
                <br />
                {item.name}
              </>
            ) : item.drink}>
              <p>Data: {formatDateTime(item.created_at)}</p>
              <p>Quantidade: {item.quantity}</p>
              <p>Valor: {formatCurrency(item.price)}</p>
              {!isBarMC &&
                <p>
                  Pago?{" "}
                  {item.paid ? (
                    <CheckOutlined style={{ color: "green" }} />
                  ) : (
                    <CloseOutlined style={{ color: "red" }} />
                  )}
                </p>
              }
              {!isBarMC && item.user && <p>Marcado por: {item.user}</p>}
            </Card>
          </List.Item>
        )}
      />
    </ConfigProvider>
  );
});

CardComand.displayName = "CardComand";
