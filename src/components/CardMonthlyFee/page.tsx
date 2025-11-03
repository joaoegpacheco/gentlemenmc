"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/hooks/use-supabase.js";

export function CardMonthlyFee() {
  const [monthlyFeeData, setMonthlyFeeData] = useState([
    {
      id: "",
      month: "",
      paid: "",
      uuid: "",
    },
  ]);

  useEffect(() => {
    const getData = async () => {

      
    let { data: monthlyFees } = await supabase
    .from('mansalidades')
    .select('*')
    .order('id', { ascending: false })


    let { data: members } = await supabase
    .from('membros')
    .select('*')

    // Combinar os dados
    const listWithNames = monthlyFees?.map(monthlyFee => {
        const member = members?.find(m => m.user_id === monthlyFee.uuid);
        return {
            ...monthlyFee,
            user_name: member ? member.user_name : 'Nome não encontrado'
        };
    });

      //@ts-ignore
      setMonthlyFeeData(listWithNames);
    };
    getData();
    
  }, []);

  return (
    <div>
      {monthlyFeeData.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">Nenhuma Mensalidade paga.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {monthlyFeeData.map((item: any) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.user_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">Mês: {item.month}</p>
                <p className="text-sm flex items-center gap-2">
                  Pago?{" "}
                  {item.paid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
