"use client";
import React, { useEffect, useState } from "react";
import { List, Card, ConfigProvider } from "antd";
import { formatarMoeda } from "@/utils/formatarMoeda.js";
import { supabase } from "@/hooks/use-supabase.js";

export function CardComandAll() {
  const [totalSoma, setTotalSoma] = useState(0);
  const [dataB, setDataB] = useState([
    {
      nomeDaPessoa: "",
      priceSomado: 0,
    },
  ]);

  useEffect(() => {
    const getData = async () => {

      const { data: bebidas } = await supabase
        .from("bebidas")
        .select("created_at, name, drink, paid, quantity, price, user, uuid")
        // Filters
        .order("created_at", { ascending: false });

      // Function to calculate sum of prices for each unique name
      const calcularSomaValores = (transacoes: Array<any> | null) => {
        const resultado: Record<string, { nomeDaPessoa: string; priceSomado: number }> = {};
        
        transacoes?.forEach((transacao) => {
          if (transacao && transacao.paid === null && transacao.price !== null) {
            if (!resultado[transacao.name]) {
              resultado[transacao.name] = { nomeDaPessoa: transacao.name, priceSomado: 0 };
            }
            resultado[transacao.name].priceSomado += parseFloat(transacao.price.toString());
          }
        });
      
        return Object.values(resultado);
      };
    
      const totalSoma = calcularSomaValores(bebidas);
    
      setDataB(totalSoma);
      setTotalSoma(totalSoma.reduce((acc, curr) => acc + (curr.priceSomado || 0), 0));
    };
    getData();
  }, []);

  return (
    <ConfigProvider
      renderEmpty={() => <div>Nenhuma dívida.</div>}
    >
      <List
      header={`Total não pago: ${formatarMoeda(totalSoma)}`}
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
                <Card title={item?.nomeDaPessoa}>
                  <p>Valor: {formatarMoeda(item?.priceSomado)}</p>
                </Card>
              </List.Item>
          </>
        )}
      />
    </ConfigProvider>
  );
}
