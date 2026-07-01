import { supabase } from "@/hooks/use-supabase";
import type { PaymentIssueReason, PaymentKind } from "@/lib/payment-notify";

export type NotifyPaymentIssuePayload = {
  orderNsu: string;
  reason: PaymentIssueReason;
  paymentKind?: PaymentKind;
  memberName?: string;
  amount?: number;
};

export async function notifyPaymentIssue(
  payload: NotifyPaymentIssuePayload
): Promise<{ ok: true; notified: boolean } | { ok: false; error: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch("/api/payments/notify-issue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      success?: boolean;
      notified?: boolean;
      error?: string;
    };

    if (!response.ok) {
      return { ok: false, error: data.error ?? "Erro ao notificar financeiro" };
    }

    return { ok: true, notified: data.notified ?? false };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao notificar financeiro",
    };
  }
}
