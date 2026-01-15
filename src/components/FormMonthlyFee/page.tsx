"use client";
import { useEffect, useCallback } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notification } from "@/lib/notification";
import { supabase } from "@/hooks/use-supabase.js";
import { useTranslations } from 'next-intl';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

type Member = {
  user_id: string;
  user_name: string;
};

export function FormMonthlyFee() {
  const t = useTranslations('formMonthlyFee');
  const tPlaceholders = useTranslations('placeholders');
  
  const monthlyFeeSchema = z.object({
    name: z.string().min(1, t('nameRequired')),
    date: z.date().optional(),
  });

  const form = useForm<z.infer<typeof monthlyFeeSchema>>({
    resolver: zodResolver(monthlyFeeSchema),
    defaultValues: {
      name: "",
      date: new Date(),
    },
  });
  const members$ = useObservable<Member[]>([]);
  const members = useValue(members$);

  const fetchMembers = useCallback(async () => {
    const { data: membersData, error } = await supabase
      .from("membros")
      .select("user_id, user_name")
      .order("user_name", { ascending: true });

    if (!error && membersData) {
      members$.set(membersData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onFinish = async (values: z.infer<typeof monthlyFeeSchema>) => {
    try {
      const dateString = values.date 
        ? dayjs(values.date).tz("UTC").format("YYYY-MM-DDTHH:mm:ss.SSSZ")
        : dayjs().tz("UTC").format("YYYY-MM-DDTHH:mm:ss.SSSZ");
      
      const { error } = await supabase
        .from("bebidas")
        .update({ paid: true })
        .eq("name", values.name)
        .lte("created_at", dateString);

      await supabase
        .from("charges")
        .update({ status: "paid" })
        .eq("customer_name", values.name);

      if (error) throw error;
      notification.success({
        message: `A conta do ${values.name} foi paga com sucesso!`,
      });
    } catch (error: any) {
      notification.error({
        message: `Erro ao tentar pagar a conta: ${error.message}`,
      });
      console.error("Error trying to change paid status:", error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFinish)} className="w-full pt-5 space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nameLabel')}</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={tPlaceholders('selectMember')} />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(({ user_id, user_name }) => (
                      <SelectItem key={user_id} value={user_name}>
                        {user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dateLimit')}</FormLabel>
              <FormControl>
                <div className="border rounded-lg p-3">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t('updating') : t('update')}
        </Button>
      </form>
    </Form>
  );
}
