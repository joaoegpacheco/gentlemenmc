"use client";
import React, { useEffect, useState } from "react";
import { List, Card, ConfigProvider } from "antd";
import { formatarDataHora } from "@/utils/formatarDataHora";
import { formatarMoeda } from "@/utils/formatarMoeda";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { supabase } from "@/hooks/use-supabase";

interface Bebida {
  created_at: string;
  name: string;
  drink: string;
  paid: boolean;
  quantity: number;
  price: number;
  user: string;
  uuid: string;
}

export function CardComand() {
  const [dataUser, setDataUser] = useState<{ id: string } | null>(null);
  const [totalSoma, setTotalSoma] = useState<number>(0);
  const [dataB, setDataB] = useState<Bebida[]>([]);

  useEffect(() => {
    const getData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      setDataUser(user);
      if (!user) return;

      const { data: bebidas } = await supabase
        .from("bebidas")
        .select("created_at, name, drink, paid, quantity, price, user, uuid")
        .eq("uuid", user.id)
        .order("created_at", { ascending: false });

      const totalSoma = bebidas?.reduce((sum, { paid, price }) => (!paid ? sum + parseFloat(price.toString()) : sum), 0) || 0;
      setDataB(bebidas || []);
      setTotalSoma(totalSoma);
    };
    getData();
  }, []);

  return (
    <ConfigProvider renderEmpty={() => <div>Nenhuma bebida marcada em seu nome.</div>}>
      <List
        header={dataUser ? `Total não pago: ${formatarMoeda(totalSoma)}` : null}
        size="small"
        bordered
        dataSource={dataB}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 4, xl: 4, xxl: 3 }}
        renderItem={(item) => (
          <List.Item key={item.uuid}>
            <Card title={item.drink}>
              <p>Data: {formatarDataHora(item.created_at)}</p>
              <p>Quantidade: {item.quantity}</p>
              <p>Valor: {formatarMoeda(item.price)}</p>
              <p>
                Pago? {item.paid ? (
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
}
