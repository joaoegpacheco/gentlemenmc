const DEFAULT_FINANCE_IN_APP_NOTIFY_EMAILS = [
  "mortari@gentlemenmc.com.br",
  "pacheco@gentlemenmc.com.br",
] as const;

/** Usuários in-app que recebem notificações de pagamento pendente. */
export function getFinanceInAppNotifyEmails(): string[] {
  const raw = process.env.FINANCE_IN_APP_NOTIFY_EMAILS;
  if (!raw?.trim()) return [...DEFAULT_FINANCE_IN_APP_NOTIFY_EMAILS];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Usuários autorizados a confirmar retorno de pagamento (InfinitePay). */
export function getPaymentConfirmAllowedEmails(): string[] {
  const raw = process.env.PAYMENT_CONFIRM_ALLOWED_EMAILS;
  if (!raw?.trim()) return [...DEFAULT_FINANCE_IN_APP_NOTIFY_EMAILS];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPaymentConfirmAllowedEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized) return false;
  return getPaymentConfirmAllowedEmails().includes(normalized);
}

/** E-mail real do tesoureiro para comprovantes. */
export const TREASURER_EMAIL = "treasurer@gentlemenmc.com.br";

export type PaymentIssueReason = "failed_return" | "incomplete_checkout";
export type PaymentKind = "debt" | "credit";

const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = {
  debt: "conta em aberto",
  credit: "compra de créditos",
};

export function formatPaymentAmount(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function buildPaymentIssueNotifyMessages(params: {
  reason: PaymentIssueReason;
  memberName: string;
  amount?: number;
  paymentKind?: PaymentKind;
  orderNsu?: string;
}) {
  const amountLabel =
    params.amount && params.amount > 0
      ? formatPaymentAmount(params.amount)
      : "valor não informado";
  const kindLabel = params.paymentKind
    ? PAYMENT_KIND_LABEL[params.paymentKind]
    : "pagamento do bar";
  const orderRef = params.orderNsu ? ` (ref. ${params.orderNsu.slice(0, 8)}…)` : "";

  if (params.reason === "failed_return") {
    return {
      title: "Pagamento bar — falha na confirmação",
      body: `${params.memberName} pagou ${amountLabel} (${kindLabel}) mas a confirmação automática falhou${orderRef}. Verifique na InfinitePay ou aguarde comprovante por e-mail.`,
      notificationType: "pagamento_bar_falha",
    };
  }

  return {
    title: "Pagamento bar — não concluído",
    body: `${params.memberName} informou que pagou ${amountLabel} (${kindLabel}) mas não conseguiu voltar ao checkout${orderRef}. Confirme o pagamento ou peça o comprovante.`,
    notificationType: "pagamento_bar_incompleto",
  };
}

export const PENDING_CHECKOUT_STORAGE_KEY = "gentlemen_pending_checkout";

export type PendingCheckoutStorage = {
  orderNsu: string;
  memberName: string;
  amount: number;
  paymentKind: PaymentKind;
  createdAt: string;
};

export function savePendingCheckout(data: PendingCheckoutStorage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify(data));
}

export function loadPendingCheckout(): PendingCheckoutStorage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCheckoutStorage;
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
}
