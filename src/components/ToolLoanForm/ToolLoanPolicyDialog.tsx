"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ToolLoanPolicyDialogProps {
  trigger?: React.ReactNode;
}

export function ToolLoanPolicyDialog({ trigger }: ToolLoanPolicyDialogProps) {
  const t = useTranslations("toolLoan");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="link" className="h-auto p-0 text-sm">
            {t("viewPolicy")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("policyTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>{t("policyIntro")}</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>{t("policyItem1")}</li>
            <li>{t("policyItem2")}</li>
            <li>{t("policyItem3")}</li>
            <li>{t("policyItem4")}</li>
            <li>{t("policyItem5")}</li>
            <li>{t("policyItem6")}</li>
          </ol>
          <p className="font-medium text-foreground">{t("policySignature")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
