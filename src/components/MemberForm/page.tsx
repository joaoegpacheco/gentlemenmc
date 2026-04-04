"use client";

import { useEffect } from "react";
import Image from 'next/image';
import { useTranslations } from 'next-intl';
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

const MEMBER_CASE_TYPES = [
  "__none__",
  "Prospect",
  "Half",
  "Diretoria",
  "Full-Revisor",
  "Full",
] as const;

type MemberCaseTypeForm = (typeof MEMBER_CASE_TYPES)[number];

interface Member {
  id?: number;
  user_id: string;
  user_name: string;
  user_email?: string;
  phone?: string;
  foto_url?: string;
  status?: "ativo" | "inativo" | "suspenso";
  observacoes?: string;
  case_type?: string | null;
  half_date?: string | null;
  cpf?: string | null;
  date_of_birth?: string | null;
  motorcycle?: string | null;
  motorcycle_license_plate?: string | null;
  emergency_telephone_number?: string | null;
  emergency_contact?: string | null;
  kinship_contact_emergency?: string | null;
  created_at?: string;
}

function caseTypeToFormValue(caseType?: string | null): MemberCaseTypeForm {
  if (!caseType) return "__none__";
  return (MEMBER_CASE_TYPES as readonly string[]).includes(caseType)
    ? (caseType as MemberCaseTypeForm)
    : "__none__";
}

function halfDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

interface MemberFormProps {
  member?: Member;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MemberForm({ member, onSuccess, onCancel }: MemberFormProps) {
  const t = useTranslations('form');
  const tCommon = useTranslations('common');
  const tMembers = useTranslations('members');
  const photoFile$ = useObservable<File | null>(null);
  const uploading$ = useObservable(false);
  const photoPreview$ = useObservable<string | null>(member?.foto_url || null);

  // Função para normalizar email - adiciona @gentlemenmc.com.br se não tiver
  const normalizeEmail = (email: string): string => {
    if (!email) return email;
    const trimmed = email.trim();
    if (!trimmed) return trimmed;
    
    // Se já tem @, verificar se é do domínio correto
    if (trimmed.includes('@')) {
      if (trimmed.endsWith('@gentlemenmc.com.br')) {
        return trimmed.toLowerCase();
      }
      // Se tem @ mas não é do domínio correto, retornar erro será tratado na validação
      return trimmed.toLowerCase();
    }
    
    // Se não tem @, adicionar @gentlemenmc.com.br
    return `${trimmed.toLowerCase()}@gentlemenmc.com.br`;
  };

  // Função para capitalizar primeira letra do nome (mantém o resto como está)
  const capitalizeFirstLetter = (name: string): string => {
    if (!name) return name;
    // Capitalizar apenas a primeira letra, mantendo o resto como o usuário digitou
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Schema base - todos os campos obrigatórios têm a mesma validação
  const baseSchema = {
    user_name: z.string()
      .min(1, tMembers('validation.nameRequired'))
      .transform((val) => capitalizeFirstLetter(val)),
    user_email: z.string()
      .min(1, tMembers('validation.emailRequired'))
      .transform((val) => normalizeEmail(val))
      .refine(
        (email) => {
          // Email é obrigatório, então não pode ser vazio
          if (!email || email.trim() === '') return false;
          // Validar formato de email e domínio
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) return false;
          return email.endsWith('@gentlemenmc.com.br');
        },
        { message: tMembers('validation.emailDomain') }
      ),
    phone: z.string()
      .min(1, tMembers('validation.phoneRequired')),
    status: z.enum(["ativo", "inativo", "suspenso"]),
    observacoes: z.string().optional(),
    case_type: z.enum(MEMBER_CASE_TYPES),
    half_date: z.string().optional(),
    cpf: z.string().optional(),
    date_of_birth: z.string().optional(),
    motorcycle: z.string().optional(),
    motorcycle_license_plate: z.string().optional(),
    emergency_telephone_number: z.string().optional(),
    emergency_contact: z.string().optional(),
    kinship_contact_emergency: z.string().optional(),
  };

  // Se está criando novo membro, senha é obrigatória
  // Se está editando, senha é opcional
  const memberSchema = !member
    ? z.object({
        ...baseSchema,
        password: z.string()
          .min(1, tMembers('validation.passwordRequired'))
          .min(6, tMembers('validation.passwordMinChars')),
      })
    : z.object({
        ...baseSchema,
        password: z.string()
          .min(6, tMembers('validation.passwordMinChars'))
          .optional()
          .or(z.literal("")),
      });

  type MemberFormValues = z.infer<typeof memberSchema>;

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema) as any,
    defaultValues: {
      user_name: member?.user_name || "",
      user_email: member?.user_email || "",
      password: "",
      phone: member?.phone ?? "",
      status: member?.status || "ativo",
      observacoes: member?.observacoes || "",
      case_type: caseTypeToFormValue(member?.case_type),
      half_date: halfDateInputValue(member?.half_date),
      cpf: member?.cpf ?? "",
      date_of_birth: halfDateInputValue(member?.date_of_birth),
      motorcycle: member?.motorcycle ?? "",
      motorcycle_license_plate: member?.motorcycle_license_plate ?? "",
      emergency_telephone_number: member?.emergency_telephone_number ?? "",
      emergency_contact: member?.emergency_contact ?? "",
      kinship_contact_emergency: member?.kinship_contact_emergency ?? "",
    },
  });

  const watchedCaseType = form.watch("case_type");

  useEffect(() => {
    if (member) {
      form.reset({
        user_name: member.user_name || "",
        user_email: member.user_email || "",
        password: "",
        phone: member.phone ?? "",
        status: member.status || "ativo",
        observacoes: member.observacoes || "",
        case_type: caseTypeToFormValue(member.case_type),
        half_date: halfDateInputValue(member.half_date),
        cpf: member.cpf ?? "",
        date_of_birth: halfDateInputValue(member.date_of_birth),
        motorcycle: member.motorcycle ?? "",
        motorcycle_license_plate: member.motorcycle_license_plate ?? "",
        emergency_telephone_number: member.emergency_telephone_number ?? "",
        emergency_contact: member.emergency_contact ?? "",
        kinship_contact_emergency: member.kinship_contact_emergency ?? "",
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
        message.error(tMembers('errorCheckingBuckets', { message: bucketError.message }));
        return null;
      }

      if (!buckets?.some((b) => b.name === "membros_fotos")) {
        message.error(tMembers('bucketNotFound'));
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
        message.error(tMembers('errorUploadingPhoto', { message: error.message }));
        return null;
      }

      if (!uploadData?.path) {
        message.error(tMembers('errorFilePathNotReturned'));
        return null;
      }

      // Obter a URL pública usando o path retornado pelo upload
      const {
        data: { publicUrl },
      } = supabase.storage.from("membros_fotos").getPublicUrl(uploadData.path);

      if (!publicUrl) {
        message.error(tMembers('errorPublicUrlNotGenerated'));
        return null;
      }

      // Salvar a URL retornada pela API do bucket no foto_url
      return publicUrl;
    } catch (error: any) {
      message.error(tMembers('errorUploading', { message: error.message }));
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
        message.error(tMembers('userNotAuthenticated'));
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
        message.error(tMembers('onlyAdminsCanManage'));
        uploading$.set(false);
        return;
      }

      let fotoUrl: string | null = member?.foto_url || null;

      // Upload da foto se houver novo arquivo
      const photoFile = photoFile$.get();
      if (photoFile) {
        const uploadedUrl = await uploadPhoto();
        if (!uploadedUrl) {
          message.error(tMembers('errorUploadingPhotoTryAgain'));
          uploading$.set(false);
          return; // Erro no upload
        }
        fotoUrl = uploadedUrl;
      }

      // Garantir que email está normalizado e nome está capitalizado
      const normalizedEmail = values.user_email ? normalizeEmail(values.user_email) : null;
      const capitalizedName = values.user_name ? capitalizeFirstLetter(values.user_name) : values.user_name;

      const resolvedCaseType =
        values.case_type === "__none__" ? null : values.case_type;
      const halfDateForDb =
        resolvedCaseType === "Half" && values.half_date?.trim()
          ? values.half_date.trim()
          : null;

      const emptyToNull = (v: string | undefined) => {
        const s = v?.trim();
        return s ? s : null;
      };

      const memberData: {
        user_name: string;
        user_email: string | null;
        phone: string;
        status: MemberFormValues["status"];
        observacoes: string | null;
        case_type: string | null;
        half_date: string | null;
        cpf: string | null;
        date_of_birth: string | null;
        motorcycle: string | null;
        motorcycle_license_plate: string | null;
        emergency_telephone_number: string | null;
        emergency_contact: string | null;
        kinship_contact_emergency: string | null;
        user_id?: string;
        foto_url?: string | null;
      } = {
        user_name: capitalizedName,
        user_email: normalizedEmail,
        phone: values.phone,
        status: values.status,
        observacoes: values.observacoes || null,
        case_type: resolvedCaseType,
        half_date: halfDateForDb,
        cpf: emptyToNull(values.cpf),
        date_of_birth: values.date_of_birth?.trim()
          ? values.date_of_birth.trim()
          : null,
        motorcycle: emptyToNull(values.motorcycle),
        motorcycle_license_plate: emptyToNull(values.motorcycle_license_plate),
        emergency_telephone_number: emptyToNull(values.emergency_telephone_number),
        emergency_contact: emptyToNull(values.emergency_contact),
        kinship_contact_emergency: emptyToNull(values.kinship_contact_emergency),
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
        const { error } = await supabase
          .from("membros")
          .update(memberData)
          .eq("user_id", member.user_id)
          .select();

        // Se o update funcionou sem erro, considerar sucesso
        // Mesmo que updateData esteja vazio (pode ser por RLS), o update foi executado

        if (error) {
          // Se for erro de RLS, fornecer mensagem mais clara
          if (error.message?.includes("row-level security") || error.code === "42501") {
            message.error(tMembers('rlsPermissionError'));
          } else {
            throw error;
          }
          return;
        }
        message.success(tMembers('memberUpdatedSuccessfully'));
      } else {
        // Criar novo membro - primeiro criar na autenticação do Supabase

        // Chamar API route para criar usuário na autenticação
        let createdUserId: string | null = null;
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
            message.error(createUserData.error || tMembers('errorCreatingUser'));
            uploading$.set(false);
            return;
          }

          // Guardar o user_id para possível rollback
          createdUserId = createUserData.user_id;

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
              message.error(tMembers('rlsErrorCreateMember'));
            } else {
              message.error(
                `Erro ao criar membro na tabela: ${error.message}. O usuário foi criado na autenticação (ID: ${createdUserId}) mas não foi possível criar na tabela membros.`
              );
              throw error;
            }
            return;
          }

          // Verificar se o membro foi realmente criado
          if (!insertData || insertData.length === 0) {
            return;
          }
          message.success(tMembers('memberAddedSuccessfully'));
        } catch (apiError: any) {
          message.error(tMembers('errorCreatingUserUnknown', { message: apiError.message || tMembers('unknownError') }));
          uploading$.set(false);
          return;
        }
      }

      onSuccess();
    } catch (error: any) {
      message.error(tMembers('errorSavingMember', { message: error.message }));
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
                message.error(tMembers('imageMaxSize'));
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
              <FormLabel>{tMembers('nameLabel')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={tMembers('fullNamePlaceholder')} 
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Capitalizar primeira letra apenas se necessário
                    if (value.length > 0 && value.charAt(0) !== value.charAt(0).toUpperCase()) {
                      const capitalized = capitalizeFirstLetter(value);
                      field.onChange(capitalized);
                    } else {
                      field.onChange(value);
                    }
                  }}
                  onBlur={(e) => {
                    // Garantir capitalização ao sair do campo
                    const value = e.target.value;
                    if (value.length > 0) {
                      const capitalized = capitalizeFirstLetter(value);
                      field.onChange(capitalized);
                    }
                    field.onBlur();
                  }}
                />
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
              <FormLabel>{tMembers('emailLabel')} *</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder={tMembers('emailPlaceholderName')}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Normalizar email em tempo real (adicionar @gentlemenmc.com.br se necessário)
                    if (value && !value.includes('@')) {
                      // Se o usuário está digitando e não tem @, deixar digitar
                      // A normalização será feita no blur ou submit
                      field.onChange(value.toLowerCase());
                    } else {
                      field.onChange(value.toLowerCase());
                    }
                  }}
                  onBlur={(e) => {
                    // Quando sair do campo, normalizar o email
                    const normalized = normalizeEmail(e.target.value);
                    field.onChange(normalized);
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                {tMembers('emailHint')}
              </p>
            </FormItem>
          )}
        />

        {!member && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tMembers('passwordLabel')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={tMembers('minimumChars')}
                    {...field}
                    required
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
              <FormLabel>{tMembers('phoneLabel')} *</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder={tMembers('phonePlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tMembers('cpfLabel')}</FormLabel>
              <FormControl>
                <Input placeholder="000.000.000-00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tMembers('dateOfBirthLabel')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="motorcycle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tMembers('motorcycleLabel')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="motorcycle_license_plate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tMembers('motorcyclePlateLabel')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergency_contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tMembers('emergencyContactLabel')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergency_telephone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tMembers('emergencyPhoneLabel')}</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kinship_contact_emergency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tMembers('kinshipEmergencyLabel')}</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>{tMembers('status')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={tMembers('selectStatus')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ativo">{tMembers('statusActive')}</SelectItem>
                  <SelectItem value="inativo">{tMembers('statusInactive')}</SelectItem>
                  <SelectItem value="suspenso">{tMembers('statusSuspended')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="case_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tMembers('caseTypeLabel')}</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v);
                  if (v !== "Half") {
                    form.setValue("half_date", "");
                  }
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={tMembers('selectCaseType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">{tMembers('caseTypeNone')}</SelectItem>
                  <SelectItem value="Prospect">{tMembers('caseTypeProspect')}</SelectItem>
                  <SelectItem value="Half">{tMembers('caseTypeHalf')}</SelectItem>
                  <SelectItem value="Diretoria">{tMembers('caseTypeDiretoria')}</SelectItem>
                  <SelectItem value="Full-Revisor">{tMembers('caseTypeFullRevisor')}</SelectItem>
                  <SelectItem value="Full">{tMembers('caseTypeFull')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedCaseType === "Half" && (
          <FormField
            control={form.control}
            name="half_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tMembers('halfDateLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  {tMembers('halfDateHint')}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tMembers('observationsLabel')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={tMembers('internalNotes')}
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
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={uploading$.get()}>
            {uploading$.get() && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {member ? t('update') : t('add')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

