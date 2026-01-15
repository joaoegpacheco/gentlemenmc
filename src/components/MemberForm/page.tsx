"use client";

import React, { useEffect } from "react";
import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "@/components/ui/upload";
import { message } from "@/lib/message";
import { supabase } from "@/hooks/use-supabase";
import { Loader2 } from "lucide-react";

const memberSchema = z.object({
  user_name: z.string().min(1, "Nome é obrigatório"),
  user_email: z.string().email("Email inválido").optional().or(z.literal("")),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(["ativo", "inativo", "suspenso"]),
  observacoes: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface Member {
  id?: number;
  user_id: string;
  user_name: string;
  user_email?: string;
  phone?: string;
  foto_url?: string;
  status?: "ativo" | "inativo" | "suspenso";
  observacoes?: string;
  created_at?: string;
}

interface MemberFormProps {
  member?: Member;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MemberForm({ member, onSuccess, onCancel }: MemberFormProps) {
  const photoFile$ = useObservable<File | null>(null);
  const uploading$ = useObservable(false);
  const photoPreview$ = useObservable<string | null>(member?.foto_url || null);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      user_name: member?.user_name || "",
      user_email: member?.user_email || "",
      password: "",
      phone: member?.phone || "",
      status: member?.status || "ativo",
      observacoes: member?.observacoes || "",
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        user_name: member.user_name || "",
        user_email: member.user_email || "",
        password: "",
        phone: member.phone || "",
        status: member.status || "ativo",
        observacoes: member.observacoes || "",
      });
      photoPreview$.set(member.foto_url || null);
    }
  }, [member, form, photoPreview$]);

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
        message.error(`Erro ao verificar buckets: ${bucketError.message}`);
        return null;
      }

      if (!buckets?.some((b) => b.name === "membros_fotos")) {
        message.error(
          'Bucket "membros_fotos" não encontrado. Por favor, crie o bucket no Supabase Dashboard: Storage → Create Bucket → Nome: "membros_fotos" → Público: Sim'
        );
        return null;
      }

      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${member?.user_id || `new_${Date.now()}`}_${Date.now()}.${fileExt}`;

      // Type assertion para garantir compatibilidade com Supabase
      const fileToUpload = photoFile as unknown as File;

      const { data: uploadData, error } = await supabase.storage
        .from("membros_fotos")
        .upload(fileName, fileToUpload, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        message.error(`Erro ao fazer upload da foto: ${error.message}`);
        return null;
      }

      if (!uploadData?.path) {
        message.error("Erro: caminho do arquivo não retornado pelo upload");
        return null;
      }

      // Obter a URL pública usando o path retornado pelo upload
      const {
        data: { publicUrl },
      } = supabase.storage.from("membros_fotos").getPublicUrl(uploadData.path);

      if (!publicUrl) {
        message.error("Erro: URL pública não foi gerada");
        return null;
      }

      // Salvar a URL retornada pela API do bucket no foto_url
      return publicUrl;
    } catch (error: any) {
      message.error(`Erro ao fazer upload: ${error.message}`);
      return null;
    }
  };

  const onSubmit = async (values: MemberFormValues) => {
    uploading$.set(true);
    try {
      // Verificar se o usuário é admin
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        message.error("Usuário não autenticado");
        uploading$.set(false);
        return;
      }

      // Verificar se é admin
      const { data: admins } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin");

      const isAdmin = !!(admins && admins.length > 0);
      const isBarMC = user.email === "barmc@gentlemenmc.com.br";

      if (!isAdmin && !isBarMC) {
        message.error("Apenas administradores podem gerenciar membros");
        uploading$.set(false);
        return;
      }

      let fotoUrl: string | null = member?.foto_url || null;

      // Upload da foto se houver novo arquivo
      const photoFile = photoFile$.get();
      if (photoFile) {
        const uploadedUrl = await uploadPhoto();
        if (!uploadedUrl) {
          message.error("Erro ao fazer upload da foto. Tente novamente.");
          uploading$.set(false);
          return; // Erro no upload
        }
        fotoUrl = uploadedUrl;
      }

      const memberData: any = {
        user_name: values.user_name,
        user_email: values.user_email || null,
        phone: values.phone || null,
        status: values.status,
        observacoes: values.observacoes || null,
      };

      // Sempre incluir foto_url explicitamente (mesmo que seja null)
      // Isso garante que o campo seja atualizado no banco
      if (fotoUrl !== undefined && fotoUrl !== null) {
        memberData.foto_url = fotoUrl;
      } else if (member?.foto_url) {
        // Se não há nova foto mas existe uma antiga, manter a antiga
        memberData.foto_url = member.foto_url;
      } else {
        // Se não há foto nova nem antiga, pode ser null
        memberData.foto_url = null;
      }

      if (member) {
        // Atualizar membro existente
        const { data: updateData, error } = await supabase
          .from("membros")
          .update(memberData)
          .eq("user_id", member.user_id)
          .select();

        // Se o update funcionou sem erro, considerar sucesso
        // Mesmo que updateData esteja vazio (pode ser por RLS), o update foi executado

        if (error) {
          // Se for erro de RLS, fornecer mensagem mais clara
          if (error.message?.includes("row-level security") || error.code === "42501") {
            message.error(
              "Erro de permissão. Verifique as políticas RLS no Supabase. Veja a documentação em RLS_POLICIES.md"
            );
            console.error("RLS Error:", error);
          } else {
            throw error;
          }
          return;
        }
        message.success("Membro atualizado com sucesso!");
      } else {
        // Criar novo membro - primeiro criar na autenticação do Supabase
        if (!values.user_email) {
          message.error("Email é obrigatório para criar um novo membro");
          uploading$.set(false);
          return;
        }

        if (!values.password || values.password.length < 6) {
          message.error("Senha é obrigatória e deve ter no mínimo 6 caracteres");
          uploading$.set(false);
          return;
        }

        // Chamar API route para criar usuário na autenticação
        try {
          const createUserResponse = await fetch('/api/members/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: values.user_email,
              password: values.password,
              phone: values.phone || null,
              user_name: values.user_name,
            }),
          });

          const createUserData = await createUserResponse.json();

          if (!createUserResponse.ok) {
            message.error(createUserData.error || 'Erro ao criar usuário na autenticação');
            uploading$.set(false);
            return;
          }

          // Usar o user_id retornado pela API
          memberData.user_id = createUserData.user_id;

          // Agora criar o membro na tabela
          const { data: insertData, error } = await supabase
            .from("membros")
            .insert([memberData])
            .select();
          
          if (error) {
            // Se for erro de RLS, fornecer mensagem mais clara
            if (error.message?.includes("row-level security") || error.code === "42501") {
              message.error(
                "Erro de permissão. Verifique as políticas RLS no Supabase. Veja a documentação em RLS_POLICIES.md"
              );
              console.error("RLS Error:", error);
            } else {
              throw error;
            }
            return;
          }
          message.success("Membro adicionado com sucesso!");
        } catch (apiError: any) {
          message.error(`Erro ao criar usuário: ${apiError.message || 'Erro desconhecido'}`);
          console.error('Erro na API create-user:', apiError);
          uploading$.set(false);
          return;
        }
      }

      onSuccess();
    } catch (error: any) {
      message.error(`Erro ao salvar membro: ${error.message}`);
      console.error(error);
    } finally {
      uploading$.set(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Foto */}
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
              <span className="text-4xl text-muted-foreground">👤</span>
            </div>
          )}
          <Upload
            accept="image/*"
            onChange={handlePhotoChange}
            beforeUpload={(file) => {
              if (file.size > 5 * 1024 * 1024) {
                message.error("A imagem deve ter no máximo 5MB");
                return false;
              }
              return true;
            }}
          />
        </div>

        <FormField
          control={form.control}
          name="user_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="user_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email {!member && "*"}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!member && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha *</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas internas sobre o membro..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={uploading$.get()}>
            {uploading$.get() && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {member ? "Atualizar" : "Adicionar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

