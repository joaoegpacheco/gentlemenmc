"use client";
import React, { useEffect, useState } from "react";
import { List, Card, ConfigProvider } from "antd";
import { formatarDataHora } from "@/utils/formatarDataHora.js";
import { formatarMoeda } from "@/utils/formatarMoeda.js";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import supabase from "@/hooks/use-supabase.js";

export function CardComand() {
  const [dataUser, setDataUser] = useState({});
  const [totalSoma, setTotalSoma] = useState(0);
  const [dataB, setDataB] = useState([
    {
      created_at: "",
      name: "",
      drink: "",
      paid: "",
      quantity: 0,
      price: 0,
      user: "",
    },
  ]);

  useEffect(() => {
    const getData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      //@ts-ignore
      setDataUser(user);

      if (!user) return;

      const { data: bebidas } = await supabase
        .from("bebidas")
        .select("created_at, name, drink, paid, quantity, price, user, uuid")
        // Filters
        //@ts-ignore
        .eq("uuid", `${user.id}`)
        .order("created_at", { ascending: false });

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
  }, []);

  return (
    <ConfigProvider
      renderEmpty={() => <div>Nenhuma bebida marcada em seu nome.</div>}
    >
      <List
        header={dataUser && `Total não pago: ${formatarMoeda(totalSoma)}`}
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
            {dataUser !== "" && (
              <List.Item>
                <Card title={item?.drink}>
                  <p>Data: {formatarDataHora(item?.created_at)}</p>
                  <p>Quantidade: {item?.quantity}</p>
                  <p>Valor: {formatarMoeda(item?.price)}</p>
                  <p>
                    Pago?{" "}
                    {item?.paid ? (
                      <CheckOutlined
                        style={{ color: "green" }}
                        twoToneColor="green"
                      />
                    ) : (
                      <CloseOutlined
                        style={{ color: "red" }}
                        twoToneColor="red"
                      />
                    )}
                  </p>
                  <p>{item?.user ? `Marcado por: ${item?.user}` : ""}</p>
                </Card>
              </List.Item>
            )}
          </>
        )}
      />
    </ConfigProvider>
  );
}
