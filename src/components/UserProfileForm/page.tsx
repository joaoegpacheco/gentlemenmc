"use client";

import React from "react";
import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from 'next-intl';
import { useObservable } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Upload } from "@/components/ui/upload";
import { message } from "@/lib/message";
import { supabase } from "@/hooks/use-supabase";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Member {
  user_id: string;
  user_name: string;
  user_email?: string;
  phone?: string;
  foto_url?: string;
  status?: "ativo" | "inativo" | "suspenso";
}

interface UserProfileFormProps {
  member: Member;
  user: any;
  onSuccess: () => void;
}

export function UserProfileForm({ member, user, onSuccess }: UserProfileFormProps) {
  const t = useTranslations('userProfileForm');
  
  const profileSchema = z.object({
    newPassword: z.string().min(6, t('passwordMinChars')).optional().or(z.literal("")),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;

  const photoFile$ = useObservable<File | null>(null);
  const uploading$ = useObservable(false);
  const photoPreview$ = useObservable<string | null>(member?.foto_url || null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  const handlePhotoChange = ({ file }: { file: File | null }) => {
    if (file) {
      photoFile$.set(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        photoPreview$.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    const photoFile = photoFile$.get();
    if (!photoFile) return member?.foto_url || null;

    try {
      // Verificar se o bucket existe
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        message.error(t('errorCheckingBuckets', { message: bucketError.message }));
        return null;
      }

      if (!buckets?.some((b) => b.name === "membros_fotos")) {
        message.error(t('bucketNotFound'));
        return null;
      }

      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${member.user_id}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error } = await supabase.storage
        .from("membros_fotos")
        .upload(fileName, photoFile as File, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        message.error(t('errorUploadingPhoto', { message: error.message }));
        return null;
      }

      if (!uploadData?.path) {
        message.error(t('errorFilePathNotReturned'));
        return null;
      }

      // Obter a URL pública usando o path retornado pelo upload
      const {
        data: { publicUrl },
      } = supabase.storage.from("membros_fotos").getPublicUrl(uploadData.path);

      if (!publicUrl) {
        message.error(t('errorPublicUrlNotGenerated'));
        return null;
      }

      return publicUrl;
    } catch (error: any) {
      message.error(t('errorUploading', { message: error.message }));
      return null;
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    uploading$.set(true);
    try {
      // Verificar se o usuário está autenticado
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      if (!currentUser) {
        message.error(t('userNotAuthenticated'));
        uploading$.set(false);
        return;
      }

      // Verificar se o usuário está tentando atualizar seu próprio perfil
      if (currentUser.id !== member.user_id) {
        message.error(t('canOnlyUpdateOwnProfile'));
        uploading$.set(false);
        return;
      }

      let fotoUrl: string | null = member?.foto_url || null;

      // Upload da foto se houver novo arquivo
      const photoFile = photoFile$.get();
      if (photoFile) {
        const uploadedUrl = await uploadPhoto();
        if (!uploadedUrl) {
          message.error(t('errorUploadingPhotoTryAgain'));
          uploading$.set(false);
          return;
        }
        fotoUrl = uploadedUrl;
      }

      // Atualizar foto na tabela membros se houver nova foto
      if (fotoUrl !== member?.foto_url) {
        const { error: updatePhotoError } = await supabase
          .from("membros")
          .update({ foto_url: fotoUrl })
          .eq("user_id", member.user_id);

        if (updatePhotoError) {
          message.error(t('errorUpdatingPhoto', { message: updatePhotoError.message }));
          uploading$.set(false);
          return;
        }
      }

      // Atualizar senha se fornecida
      if (values.newPassword && values.newPassword.length >= 6) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: values.newPassword,
        });

        if (passwordError) {
          message.error(t('errorUpdatingPassword', { message: passwordError.message }));
          uploading$.set(false);
          return;
        }
      }

      // Limpar formulário
      form.reset({ newPassword: "" });
      photoFile$.set(null);

      message.success(t('profileUpdatedSuccessfully'));
      onSuccess();
    } catch (error: any) {
      message.error(t('errorUpdatingProfile', { message: error.message }));
      console.error(error);
    } finally {
      uploading$.set(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Seção de Foto */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profilePhoto')}</CardTitle>
              <CardDescription>
                {t('updateProfilePhoto')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                {photoPreview$.get() ? (
                  <Image
                    src={photoPreview$.get() as string}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="object-cover rounded-full w-32 h-32"
                    priority
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2">
                    <span className="text-4xl text-muted-foreground">
                      {member.user_name?.charAt(0).toUpperCase() || "👤"}
                    </span>
                  </div>
                )}
                <Upload
                  accept="image/*"
                  onChange={handlePhotoChange}
                  beforeUpload={(file) => {
                    if (file.size > 5 * 1024 * 1024) {
                      message.error(t('imageMaxSize'));
                      return false;
                    }
                    return true;
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção de Senha */}
          <Card>
            <CardHeader>
              <CardTitle>{t('changePassword')}</CardTitle>
              <CardDescription>
                {t('enterNewPasswordDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('newPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={uploading$.get()}>
              {uploading$.get() && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('updateProfile')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

