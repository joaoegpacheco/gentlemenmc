"use client";
import React, { useEffect, useState } from "react";
import { List, Card, Select, ConfigProvider } from "antd";
import { createClient } from "@supabase/supabase-js";
import { formatarDataHora } from "@/utils/formatarDataHora.js";
import { formatarMoeda } from "@/utils/formatarMoeda.js";

const supabase = createClient(
  "https://cuqvbjobsgfbfahjrzeq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXZiam9ic2dmYmZhaGpyemVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg5ODgxOTQsImV4cCI6MjAzNDU2NDE5NH0.4TzTzyJZSAnZckDTCEQrVYg6MLmpyHkg1VvI-gipXAU"
);

export function CardComand() {
  const [member, setMember] = useState("");
  const [totalSoma, setTotalSoma] = useState(0);
  const [dataB, setDataB] = useState([
    {
      created_at: "",
      name: "",
      drink: "",
      paid: "",
      quantity: 0,
      price: 0,
    },
  ]);

  useEffect(() => {
    if (member === "") return;
    const getData = async () => {
      const { data: bebidas } = await supabase
        .from("bebidas")
        .select("created_at, name, drink, paid, quantity, price")
        // Filters
        .eq("name", `${member}`);

      // Função para calcular a soma dos valores
      const calcularSoma = (dados: any) => {
        return dados.reduce((acc: any, curr: any) => acc + curr.price, 0);
      };

      // Função para calcular a soma dos valores se valorPago for false
      function calcularSomaValores(transacoes: any) {
        let soma = 0;

        transacoes.forEach((transacao: any) => {
          if (!transacao.paid) {
            soma += parseFloat(transacao.price); // Assumindo que 'valor' é um campo numérico
          }
        });

        return soma;
      }

      const totalSoma = calcularSomaValores(bebidas);
      //@ts-ignore
      setDataB(bebidas);
      setTotalSoma(totalSoma);
    };
    getData();
  }, [member]);

  const onChangeSelect = (value: any) => {
    setMember(value);
  };

  return (
    <>
      <Select
        style={{ width: "100%", marginBottom: 20 }}
        onChange={onChangeSelect}
        defaultValue={"Selecione um nome"}
        size="large"
      >
        <Select.Option value="Alex">Alex</Select.Option>
        <Select.Option value="André">André</Select.Option>
        <Select.Option value="Athayde">Athayde</Select.Option>
        <Select.Option value="Bacelar">Bacelar</Select.Option>
        <Select.Option value="Baeza">Baeza</Select.Option>
        <Select.Option value="Beto">Beto</Select.Option>
        <Select.Option value="Cláudio">Cláudio</Select.Option>
        <Select.Option value="Fernando">Fernando</Select.Option>
        <Select.Option value="Giuliano">Giuliano</Select.Option>
        <Select.Option value="Gulitich">Gulitich</Select.Option>
        <Select.Option value="Índio">Índio</Select.Option>
        <Select.Option value="Jeferson">Jeferson</Select.Option>
        <Select.Option value="João Marius">João Marius</Select.Option>
        <Select.Option value="Madalosso">Madalosso</Select.Option>
        <Select.Option value="Maicon">Maicon</Select.Option>
        <Select.Option value="Mega">Mega</Select.Option>
        <Select.Option value="Mortari">Mortari</Select.Option>
        <Select.Option value="Pacheco">Pacheco</Select.Option>
        <Select.Option value="Rafael">Rafael</Select.Option>
        <Select.Option value="Rodrigo N.D">Rodrigo N.D</Select.Option>
        <Select.Option value="Rodrigo">Rodrigo</Select.Option>
        <Select.Option value="Rogério">Rogério</Select.Option>
        <Select.Option value="Weriton">Weriton</Select.Option>
        <Select.Option value="Zanona">Zanona</Select.Option>
        <Select.Option value="Zeca">Zeca</Select.Option>
        <Select.Option value="Zé Carlos">Zé Carlos</Select.Option>
        <Select.Option value="Zorek">Zorek</Select.Option>
        <Select.Option value="Robson">Robson</Select.Option>
        <Select.Option value="Romanel">Romanel</Select.Option>
      </Select>
      <ConfigProvider
        renderEmpty={() => <div>Nenhuma bebida marcada em seu nome.</div>}
      >
        <List
          header={
            member !== "" && `Total não pago: ${formatarMoeda(totalSoma)}`
          }
          size="small"
          bordered
          dataSource={dataB}
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 4,
            lg: 4,
            xl: 6,
            xxl: 3,
          }}
          renderItem={(item) => (
            <>
              {member !== "" && (
                <List.Item>
                  <Card title={item?.drink}>
                    <p>Data: {formatarDataHora(item?.created_at)}</p>
                    <p>Quantidade: {item?.quantity}</p>
                    <p>Valor: {formatarMoeda(item?.price)}</p>
                    <p>Pago? {item?.paid ? "Pago" : "Não Pago"}</p>
                  </Card>
                </List.Item>
              )}
            </>
          )}
        />
      </ConfigProvider>
    </>
  );
}
