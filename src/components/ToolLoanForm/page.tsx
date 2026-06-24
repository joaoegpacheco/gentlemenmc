"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Camera, Upload as UploadIcon } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { message } from "@/lib/message";
import { postAuthenticatedJson } from "@/lib/authenticated-fetch";
import { supabase } from "@/hooks/use-supabase";
import { ToolLoanPolicyDialog } from "./ToolLoanPolicyDialog";
import { ToolLoanCard, type ToolLoan } from "./ToolLoanCard";

const SECTORS = [
  "oficina",
  "cozinha",
  "deposito",
  "salao",
  "externo",
  "outros",
] as const;

export function ToolLoanForm() {
  const t = useTranslations("toolLoan");
  const [loans, setLoans] = useState<ToolLoan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const loanSchema = z.object({
    itemDescription: z.string().min(3, t("itemDescriptionRequired")),
    sector: z.string().min(1, t("sectorRequired")),
    photo: z.instanceof(File, { message: t("photoRequired") }),
    agreedToPolicy: z.boolean().refine((val) => val === true, {
      message: t("mustAgreeToPolicy"),
    }),
  });

  const form = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema) as any,
    defaultValues: {
      itemDescription: "",
      sector: "",
      agreedToPolicy: false,
    },
  });

  const fetchLoans = async () => {
    setLoadingLoans(true);
    const { data, error } = await supabase
      .from("emprestimos_sede")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      message.error(t("errorLoadingLoans"));
      setLoans([]);
    } else {
      setLoans(data ?? []);
    }
    setLoadingLoans(false);
  };

  useEffect(() => {
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sectorLabel = (sector: string) =>
    t(`sectors.${sector}` as "sectors.oficina");

  const handleSave = async (values: z.infer<typeof loanSchema>) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      message.error(t("userNotAuthenticated"));
      return;
    }

    const { data: memberData } = await supabase
      .from("membros")
      .select("user_name")
      .eq("user_id", user.id)
      .single();

    const userName = memberData?.user_name ?? user.email ?? t("unknownUser");

    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError || !buckets?.some((b) => b.name === "emprestimos_sede")) {
      message.error(t("bucketNotFound"));
      return;
    }

    const fileExt = values.photo.name.split(".").pop() ?? "jpg";
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("emprestimos_sede")
      .upload(fileName, values.photo);

    if (uploadError) {
      message.error(t("errorUploadingPhoto", { message: uploadError.message }));
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("emprestimos_sede")
      .getPublicUrl(uploadData.path);

    const { data: inserted, error } = await supabase
      .from("emprestimos_sede")
      .insert([
        {
          user_id: user.id,
          user_name: userName,
          item_description: values.itemDescription.trim(),
          sector: values.sector,
          photo_url: publicUrlData.publicUrl,
          agreed_to_policy: true,
        },
      ])
      .select("id")
      .single();

    if (error) {
      message.error(t("errorSavingLoan"));
      return;
    }

    const eventAt = new Date().toISOString();
    void postAuthenticatedJson("/api/emprestimos/notify", {
      event: "loan",
      loanId: inserted.id,
      userName,
      itemDescription: values.itemDescription.trim(),
      sectorLabel: sectorLabel(values.sector),
      eventAt,
    }).catch((err) => {
      console.error("Falha ao enviar notificação:", err);
    });

    message.success(t("loanSavedSuccessfully"));
    form.reset();
    setPhotoPreview(null);
    fetchLoans();
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("registerLoan")}</h2>
        <p className="text-sm text-muted-foreground">{t("registerLoanDescription")}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          <FormField
            control={form.control}
            name="itemDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("itemDescription")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("itemDescriptionPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("sector")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectSector")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {t(`sectors.${sector}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="photo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("photo")}</FormLabel>
                <FormControl>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhotoPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="tool-loan-photo"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("tool-loan-photo")?.click()}
                      className="w-full"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {field.value ? field.value.name : t("takePhoto")}
                    </Button>
                    {photoPreview && (
                      <div className="mt-3 relative w-full aspect-video rounded-lg overflow-hidden border">
                        <Image
                          src={photoPreview}
                          alt={t("photoPreview")}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreedToPolicy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true ? true : false)
                    }
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    {t("agreeToPolicy")}{" "}
                    <ToolLoanPolicyDialog
                      trigger={
                        <button
                          type="button"
                          className="text-primary underline underline-offset-4 hover:no-underline"
                        >
                          {t("viewPolicy")}
                        </button>
                      }
                    />
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            {form.formState.isSubmitting ? t("saving") : t("saveLoan")}
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("recentLoans")}</h2>
          <p className="text-sm text-muted-foreground">{t("recentLoansDescription")}</p>
        </div>

        {loadingLoans ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("loadingLoans")}</p>
        ) : loans.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("noLoansYet")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {loans.map((loan) => (
              <ToolLoanCard
                key={loan.id}
                loan={loan}
                sectorLabel={sectorLabel}
                onReturned={fetchLoans}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
