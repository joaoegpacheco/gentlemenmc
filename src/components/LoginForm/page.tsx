"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { notification } from "@/lib/notification";
import { supabase } from "@/hooks/use-supabase";
import Image from 'next/image';

export const LoginForm: React.FC = () => {
  const t = useTranslations();
  const router = useRouter();
  
  const loginSchema = z.object({
    email: z.string().email(t('auth.validation.invalidEmail')).min(1, t('auth.validation.emailRequired')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    const { email, password } = values;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      notification.error({
        message: t('auth.login.errorTitle'),
        description: error.message,
      });
      console.error("Erro ao fazer login:", error.message);
      return;
    }

    // Pegar o token da sessão
    const session = await supabase.auth.getSession();
    const authToken = session.data.session?.access_token;
    const userEmail = session.data.session?.user.email;

    if (authToken) {
      // Se for o usuário especial, usar cookie sem expiração
      if (userEmail === "barmc@gentlemenmc.com.br") {
        // eslint-disable-next-line react-hooks/immutability
        document.cookie = `authToken=${authToken}; path=/; Secure; SameSite=Lax`;
      } else {
        // Para outros usuários, cookie com expiração padrão de 1 dia
        // eslint-disable-next-line react-hooks/immutability
        document.cookie = `authToken=${authToken}; path=/; max-age=86400; Secure; SameSite=Lax`;
      }
      // Redirecionar para a página privada
      router.push("/comandas");
    } else {
      notification.error({
        message: t('auth.login.tokenError'),
        description: t('auth.login.tokenErrorDescription'),
      });
    }
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 w-full">
      <Image
        src="/images/gentlemenmc.png"
        alt="Logo Gentlemen MC"
        width={200}
        height={200}
        className="object-contain"
      />                  
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full p-5 space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.login.emailLabel')}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.login.passwordLabel')}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            {t('auth.login.submitButton')}
          </Button>
        </form>
      </Form>
      <span className="text-xs text-gray-500">{t('auth.login.contactAdmin')}</span>
    </section>
  );
};
