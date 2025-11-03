"use client";
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
import { supabase } from "@/hooks/use-supabase.js";

const passwordSchema = z.object({
  newPassword: z.string().min(1, "Por favor, insira a nova senha!"),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const ChangePasswordForm = () => {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  const handleChangePassword = async (values: PasswordFormValues) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;
      notification.success({ message: "Sua senha foi alterada com sucesso!" });
      window.location.href = "/comandas";
    } catch (error: any) {
      notification.error({
        message: `Erro ao tentar trocar sua senha: ${error.message}`,
      });
      console.error("Error changing password:", error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleChangePassword)} className="space-y-4">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Alterando..." : "Alterar Senha"}
        </Button>
      </form>
    </Form>
  );
};
