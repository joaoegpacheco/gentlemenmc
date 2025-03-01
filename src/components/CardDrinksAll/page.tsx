"use client";
import React, { useEffect, useState } from "react";
import { List, Card, ConfigProvider } from "antd";
import { supabase } from "@/hooks/use-supabase.js";
import { formatCurrency } from "@/utils/formatCurrency";

export function CardComandAll() {
  const [totalSum, setTotalSum] = useState(0);
  const [dataB, setDataB] = useState([
    {
      name: "",
      sumPrice: 0,
    },
  ]);

  useEffect(() => {
    const getData = async () => {

      const { data: drinks } = await supabase
        .from("bebidas")
        .select("created_at, name, drink, paid, quantity, price, user, uuid")
        // Filters
        .order("created_at", { ascending: false });

      // Função para calcular a soma dos preços para cada nome único
      const calculateSumValues = (transactions: Array<any> | null) => {
        const result: Record<string, { name: string; sumPrice: number }> = {};
      
        transactions?.forEach((transaction) => {
          if (!transaction) return;
      
          const price = Number(transaction.price); // Converte para número corretamente
          const isPaid = transaction.paid === null || transaction.paid === false || transaction.paid === 0; 
      
          if (isPaid && !isNaN(price)) {
            if (!result[transaction.name]) {
              result[transaction.name] = { name: transaction.name, sumPrice: 0 };
            }
            result[transaction.name].sumPrice += price;
          }
        });
        // Converte o objeto em array e ordena pela soma de forma decrescente
        return Object.values(result).sort((a, b) => b.sumPrice - a.sumPrice);
      };
    
      const totalSumBase = calculateSumValues(drinks);
    
      setDataB(totalSumBase);
      setTotalSum(totalSumBase.reduce((acc, curr) => acc + (curr.sumPrice || 0), 0));
    };
      getData();
  }, []);

  return (
    <ConfigProvider
      renderEmpty={() => <div>Nenhuma dívida.</div>}
    >
      <List
      header={`Total não pago: ${formatCurrency(totalSum)}`}
        size="small"
        bordered
        dataSource={dataB}
        grid={{
          gutter: 16,
          xs: 1,
          sm: 2,
          md: 4,
          lg: 4,
          xl: 4,
          xxl: 3,
        }}
        renderItem={(item) => (
          <>
              <List.Item>
                <Card title={item?.name}>
                  <p>Valor: {formatCurrency(item?.sumPrice)}</p>
                </Card>
              </List.Item>
          </>
        )}
      />
    </ConfigProvider>
  );
}
