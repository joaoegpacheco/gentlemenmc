"use client";
import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { List, Card, ConfigProvider } from "antd";
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

export const CardComand = forwardRef((_,ref) => {
  const [userData, setUserData] = useState<{ id: string } | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [drinksData, setDrinksData] = useState<Drink[]>([]);

  const fetchData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    setUserData(user);
    if (!user) return;

    const { data: drinks } = await supabase
      .from("bebidas")
      .select("created_at, name, drink, paid, quantity, price, user, uuid")
      .eq("uuid", user.id)
      .order("created_at", { ascending: false });

    const total = drinks?.reduce((sum, { paid, price }) => (!paid ? sum + parseFloat(price.toString()) : sum), 0) || 0;
    setDrinksData(drinks || []);
    setTotalAmount(total);
  };

  useImperativeHandle(ref, () => ({
    refreshData: fetchData,
  }));

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ConfigProvider renderEmpty={() => <div>Nenhuma bebida marcada em seu nome.</div>}>
      <List
        header={userData ? `Total não pago: ${formatCurrency(totalAmount)}` : null}
        size="small"
        bordered
        dataSource={drinksData}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 4, xl: 4, xxl: 3 }}
        renderItem={(item) => (
          <List.Item key={item.uuid}>
            <Card title={item.drink}>
              <p>Data: {formatDateTime(item.created_at)}</p>
              <p>Quantidade: {item.quantity}</p>
              <p>Valor: {formatCurrency(item.price)}</p>
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
});

CardComand.displayName = "CardComand";