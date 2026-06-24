/**
 * Telegram Bot API — alertas de empréstimo Sede
 *
 * Setup:
 * 1. Crie um bot com @BotFather no Telegram → copie o token
 * 2. Destinatário abre o bot e envia /start
 * 3. Rode: npm run telegram:chat-id (para descobrir o chat_id)
 * 4. .env.local:
 *    TELEGRAM_BOT_TOKEN=123456:ABC...
 *    TELEGRAM_CHAT_ID=987654321
 *    (vários: TELEGRAM_CHAT_ID=111,222)
 */

export function getTelegramChatIds(): string[] {
  const raw = process.env.TELEGRAM_CHAT_ID;
  if (!raw?.trim()) return [];
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}

export function isTelegramConfigured(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN && getTelegramChatIds().length > 0;
}

export function isTelegramLoanNotifyEnabled(): boolean {
  if (process.env.ENABLE_TELEGRAM_LOAN_NOTIFY === "false") return false;
  return isTelegramConfigured();
}

export async function sendTelegramNotification(text: string): Promise<{
  chatCount: number;
}> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getTelegramChatIds();

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN não definido");
  }
  if (chatIds.length === 0) {
    throw new Error("TELEGRAM_CHAT_ID não definido");
  }

  const errors: string[] = [];

  for (const chatId of chatIds) {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      }
    );

    const data = (await response.json()) as {
      ok: boolean;
      description?: string;
    };

    if (!response.ok || !data.ok) {
      errors.push(`${chatId}: ${data.description ?? response.statusText}`);
    }
  }

  if (errors.length === chatIds.length) {
    throw new Error(`Telegram falhou: ${errors.join("; ")}`);
  }

  if (errors.length > 0) {
    console.warn("Telegram: alguns destinos falharam:", errors);
  }

  return { chatCount: chatIds.length - errors.length };
}
