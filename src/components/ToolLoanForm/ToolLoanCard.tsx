"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { Camera, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { message } from "@/lib/message";
import { postAuthenticatedJson } from "@/lib/authenticated-fetch";
import { supabase } from "@/hooks/use-supabase";

export interface ToolLoan {
  id: string;
  user_id: string;
  user_name: string;
  item_description: string;
  sector: string;
  photo_url: string;
  created_at: string;
  returned_at: string | null;
  return_photo_url: string | null;
  returned_by_user_id: string | null;
  returned_by_user_name: string | null;
}

interface ToolLoanCardProps {
  loan: ToolLoan;
  sectorLabel: (sector: string) => string;
  onReturned: () => void;
}

export function ToolLoanCard({ loan, sectorLabel, onReturned }: ToolLoanCardProps) {
  const t = useTranslations("toolLoan");
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnPhoto, setReturnPhoto] = useState<File | null>(null);
  const [returnPreview, setReturnPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isReturned = !!loan.returned_at;

  const handleReturnPhotoChange = (file: File | undefined) => {
    if (!file) return;
    setReturnPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setReturnPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetReturnForm = () => {
    setReturnPhoto(null);
    setReturnPreview(null);
  };

  const handleCompleteReturn = async () => {
    if (!returnPhoto) {
      message.error(t("returnPhotoRequired"));
      return;
    }

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

    const returnedByName = memberData?.user_name ?? user.email ?? t("unknownUser");

    setSubmitting(true);

    const fileExt = returnPhoto.name.split(".").pop() ?? "jpg";
    const fileName = `return_${loan.id}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("emprestimos_sede")
      .upload(fileName, returnPhoto);

    if (uploadError) {
      message.error(t("errorUploadingPhoto", { message: uploadError.message }));
      setSubmitting(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("emprestimos_sede")
      .getPublicUrl(uploadData.path);

    const { error } = await supabase
      .from("emprestimos_sede")
      .update({
        returned_at: new Date().toISOString(),
        return_photo_url: publicUrlData.publicUrl,
        returned_by_user_id: user.id,
        returned_by_user_name: returnedByName,
      })
      .eq("id", loan.id)
      .is("returned_at", null);

    setSubmitting(false);

    if (error) {
      message.error(t("errorCompletingReturn"));
      return;
    }

    const eventAt = new Date().toISOString();
    void postAuthenticatedJson("/api/emprestimos/notify", {
      event: "return",
      loanId: loan.id,
      userName: loan.user_name,
      itemDescription: loan.item_description,
      sectorLabel: sectorLabel(loan.sector),
      eventAt,
      returnedByName,
    }).catch((err) => {
      console.error("Falha ao enviar notificação de devolução:", err);
    });

    message.success(t("returnCompletedSuccessfully"));
    setReturnOpen(false);
    resetReturnForm();
    onReturned();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{loan.user_name}</CardTitle>
          {isReturned ? (
            <Badge variant="secondary" className="shrink-0">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t("returned")}
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">
              {t("pendingReturn")}
            </Badge>
          )}
        </div>
        <CardDescription>
          {t("borrowedAt")}{" "}
          {format(new Date(loan.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </CardDescription>
        {isReturned && loan.returned_at && (
          <CardDescription>
            {t("returnedAt")}{" "}
            {format(new Date(loan.returned_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {loan.returned_by_user_name && (
              <> · {t("returnedBy", { name: loan.returned_by_user_name })}</>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">{loan.item_description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("sector")}: {sectorLabel(loan.sector)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">{t("loanPhoto")}</p>
          <div className="relative w-full aspect-video rounded-md overflow-hidden border">
            <Image
              src={loan.photo_url}
              alt={loan.item_description}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        {isReturned && loan.return_photo_url && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("returnPhoto")}</p>
            <div className="relative w-full aspect-video rounded-md overflow-hidden border">
              <Image
                src={loan.return_photo_url}
                alt={t("returnPhoto")}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}

        {!isReturned && (
          <Dialog
            open={returnOpen}
            onOpenChange={(open) => {
              setReturnOpen(open);
              if (!open) resetReturnForm();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t("markAsReturned")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("completeReturn")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("completeReturnDescription")}</p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleReturnPhotoChange(e.target.files?.[0])}
                  className="hidden"
                  id={`return-photo-${loan.id}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(`return-photo-${loan.id}`)?.click()}
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {returnPhoto ? returnPhoto.name : t("takeReturnPhoto")}
                </Button>
                {returnPreview && (
                  <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                    <Image
                      src={returnPreview}
                      alt={t("returnPhotoPreview")}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={handleCompleteReturn}
                  disabled={submitting || !returnPhoto}
                >
                  {submitting ? t("completingReturn") : t("confirmReturn")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
