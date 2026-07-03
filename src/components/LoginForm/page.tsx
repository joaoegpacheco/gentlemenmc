"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
} from "@radix-ui/themes";
import { notification } from "@/lib/notification";
import { supabase } from "@/hooks/use-supabase";
import {
  syncEventNotifications,
  toastEventNotifications,
} from "@/lib/sync-event-notifications";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

export const LoginForm: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loginSchema = z.object({
    email: z
      .string()
      .email(t("auth.validation.invalidEmail"))
      .min(1, t("auth.validation.emailRequired")),
    password: z.string().min(1, t("auth.validation.passwordRequired")),
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
    setIsSubmitting(true);
    try {
      const { email, password } = values;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        notification.error({
          message: t("auth.login.errorTitle"),
          description: error.message,
        });
        return;
      }

      const session = await supabase.auth.getSession();
      const authToken = session.data.session?.access_token;
      const refreshToken = session.data.session?.refresh_token;
      const userEmail = session.data.session?.user.email;
      const userId = session.data.session?.user.id;

      if (authToken && userId) {
        if (userEmail !== "barmc@gentlemenmc.com.br") {
          const { data: memberData, error: memberError } = await supabase
            .from("membros")
            .select("user_id")
            .eq("user_id", userId)
            .single();

          if (memberError || !memberData) {
            await supabase.auth.signOut();

            // eslint-disable-next-line react-hooks/immutability
            document.cookie = `authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`;

            notification.error({
              message: t("auth.login.userDeleted"),
              description: t("auth.login.userDeletedDescription"),
            });

            return;
          }
        }

        const secure =
          typeof window !== "undefined" && window.location.protocol === "https:"
            ? "; Secure"
            : "";

        if (userEmail === "barmc@gentlemenmc.com.br") {
          // eslint-disable-next-line react-hooks/immutability
          document.cookie = `authToken=${authToken}; path=/; SameSite=Lax${secure}`;
          if (refreshToken) {
            // eslint-disable-next-line react-hooks/immutability
            document.cookie = `refreshToken=${refreshToken}; path=/; SameSite=Lax${secure}`;
          }
        } else {
          // eslint-disable-next-line react-hooks/immutability
          document.cookie = `authToken=${authToken}; path=/; max-age=86400; SameSite=Lax${secure}`;
          if (refreshToken) {
            // eslint-disable-next-line react-hooks/immutability
            document.cookie = `refreshToken=${refreshToken}; path=/; max-age=86400; SameSite=Lax${secure}`;
          }
        }

        const syncResult = await syncEventNotifications(
          locale === "en" ? "en" : "pt"
        );
        toastEventNotifications(syncResult.notifications, (opts) =>
          toast({ title: opts.title, description: opts.description })
        );

        router.push("/comandas");
      } else {
        notification.error({
          message: t("auth.login.tokenError"),
          description: t("auth.login.tokenErrorDescription"),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box className="login-page" width="100%">
      <Flex
        direction="column"
        align="center"
        gap="5"
        position="relative"
        style={{ zIndex: 1 }}
        width="100%"
      >
        <Image
          src="/images/gentlemenmc.png"
          alt={t("auth.login.logoAlt")}
          width={120}
          height={120}
          className="object-contain"
          priority
        />

        <Card
          size="4"
          variant="surface"
          style={{ width: "100%", maxWidth: 450 }}
        >
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Flex direction="column" gap="4">
              <Heading size="6" weight="medium">
                {t("auth.login.title")}
              </Heading>

              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Flex direction="column" gap="2">
                    <Text as="label" size="2" weight="medium" htmlFor="email">
                      {t("auth.login.emailLabel")}
                    </Text>
                    <TextField.Root
                      id="email"
                      type="email"
                      size="3"
                      placeholder={t("auth.login.emailPlaceholder")}
                      autoComplete="email"
                      {...field}
                      color={fieldState.error ? "red" : undefined}
                    />
                    {fieldState.error && (
                      <Text size="1" color="red">
                        {fieldState.error.message}
                      </Text>
                    )}
                  </Flex>
                )}
              />

              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Flex direction="column" gap="2">
                    <Text as="label" size="2" weight="medium" htmlFor="password">
                      {t("auth.login.passwordLabel")}
                    </Text>
                    <TextField.Root
                      id="password"
                      type="password"
                      size="3"
                      placeholder={t("auth.login.passwordPlaceholder")}
                      autoComplete="current-password"
                      {...field}
                      color={fieldState.error ? "red" : undefined}
                    />
                    {fieldState.error && (
                      <Text size="1" color="red">
                        {fieldState.error.message}
                      </Text>
                    )}
                  </Flex>
                )}
              />

              <Flex gap="3" justify="end" pt="2">
                <Button
                  type="submit"
                  size="3"
                  disabled={isSubmitting}
                >
                  {t("auth.login.submitButton")}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Card>

        <Text size="1" color="gray" align="center" style={{ maxWidth: 360 }}>
          {t("auth.login.contactAdmin")}
        </Text>
      </Flex>
    </Box>
  );
};
