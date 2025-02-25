"use client";
import React, { useEffect, useState } from "react";
import { List, Card, ConfigProvider, notification } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { supabase } from "@/hooks/use-supabase.js";

export function CardMonthlyFee() {
  const [dataB, setDataB] = useState([
    {
      id: "",
      month: "",
      paid: "",
      uuid: "",
    },
  ]);

  useEffect(() => {
    const getData = async () => {

      
    let { data: mansalidades } = await supabase
    .from('mansalidades')
    .select('*')
    .order('id', { ascending: false })


    let { data: membros } = await supabase
    .from('membros')
    .select('*')

    // Combinar os dados
    const listWithNames = mansalidades?.map(mansalidade => {
        const membro = membros?.find(membro => membro.user_id === mansalidade.uuid);
        return {
            ...mansalidade,
            user_name: membro ? membro.user_name : 'Nome não encontrado'
        };
    });

      //@ts-ignore
      setDataB(listWithNames);
    };
    getData();
    
  }, []);

  return (
    <ConfigProvider
      renderEmpty={() => <div>Nenhuma Mensalidade paga.</div>}
    >
      <List
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
                {/* @ts-ignore */}
                <Card title={item?.user_name}>
                  <p>Mês: {item?.month}</p>
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
                </Card>
              </List.Item>
          </>
        )}
      />
    </ConfigProvider>
  );
}
