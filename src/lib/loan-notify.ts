const DEFAULT_NOTIFY_EMAILS = ["robson@gentlemenmc.com.br"];

export type LoanNotifyEvent = "loan" | "return";

export function getLoanNotifyEmails(): string[] {
  const raw = process.env.EMPRESTIMO_NOTIFY_EMAILS;
  if (!raw?.trim()) return DEFAULT_NOTIFY_EMAILS;
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isTelegramLoanNotifyEnabled(): boolean {
  if (process.env.ENABLE_TELEGRAM_LOAN_NOTIFY === "false") return false;
  return !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID?.trim();
}

function formatEventDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function buildLoanNotifyMessages(params: {
  event: LoanNotifyEvent;
  userName: string;
  itemDescription: string;
  sectorLabel: string;
  eventAt: string;
  returnedByName?: string;
}) {
  const dateTime = formatEventDateTime(params.eventAt);

  if (params.event === "return") {
    const returnedBy = params.returnedByName ?? "Alguém";
    const title = "Devolução na Sede";
    const body = `${returnedBy} devolveu: ${params.itemDescription} (${params.sectorLabel}) — emprestado por ${params.userName} — ${dateTime}`;
    const externalMessage = [
      "✅ Devolução Sede — Gentlemen MC",
      "",
      `${returnedBy} registrou a devolução:`,
      `📦 ${params.itemDescription}`,
      `📍 Setor: ${params.sectorLabel}`,
      `👤 Emprestado por: ${params.userName}`,
      `🕐 ${dateTime}`,
    ].join("\n");

    return {
      title,
      body,
      externalMessage,
      notificationType: "emprestimo_sede_devolucao",
    };
  }

  const title = "Novo empréstimo na Sede";
  const body = `${params.userName} retirou: ${params.itemDescription} (${params.sectorLabel}) — ${dateTime}`;
  const externalMessage = [
    "🔧 Empréstimo Sede — Gentlemen MC",
    "",
    `${params.userName} retirou um item da Sede:`,
    `📦 ${params.itemDescription}`,
    `📍 Setor: ${params.sectorLabel}`,
    `🕐 ${dateTime}`,
  ].join("\n");

  return {
    title,
    body,
    externalMessage,
    notificationType: "emprestimo_sede",
  };
}

/** @deprecated Use buildLoanNotifyMessages */
export function buildLoanNotificationContent(params: {
  userName: string;
  itemDescription: string;
  sectorLabel: string;
  createdAt: string;
}) {
  const { title, body } = buildLoanNotifyMessages({
    event: "loan",
    ...params,
    eventAt: params.createdAt,
  });
  return { title, body };
}
