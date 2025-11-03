"use client";
import React from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { notification } from "@/lib/notification";
import { supabase } from "@/hooks/use-supabase";
import { useRouter } from "next/navigation";
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Por favor, insira seu email!"),
  password: z.string().min(1, "Por favor, insira sua senha!"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const router = useRouter();
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
        message: "Erro ao fazer login",
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
        document.cookie = `authToken=${authToken}; path=/; Secure; SameSite=Lax`;
      } else {
        // Para outros usuários, cookie com expiração padrão de 1 dia
        document.cookie = `authToken=${authToken}; path=/; max-age=86400; Secure; SameSite=Lax`;
      }
      // Redirecionar para a página privada
      router.push("/comandas");
    } else {
      notification.error({
        message: "Erro ao recuperar token",
        description: "Não foi possível recuperar o token de autenticação.",
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
                <FormLabel>Email</FormLabel>
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
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </Form>
      <span className="text-xs text-gray-500">Para acesso ao sistema, entre em contato com o administrador</span>
    </section>
  );
};
