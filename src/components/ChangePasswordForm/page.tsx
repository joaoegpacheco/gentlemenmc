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
import { useTranslations } from 'next-intl';

type PasswordFormValues = {
  newPassword: string;
};

export const ChangePasswordForm = () => {
  const t = useTranslations('changePassword');
  
  const passwordSchema = z.object({
    newPassword: z.string().min(1, t('newPasswordRequired')),
  });

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
      notification.success({ message: t('passwordChangedSuccessfully') });
      window.location.href = "/comandas";
    } catch (error: any) {
      notification.error({
        message: t('errorChangingPassword', { message: error.message }),
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
          {form.formState.isSubmitting ? t('changing') : t('changePassword')}
        </Button>
      </form>
    </Form>
  );
};
