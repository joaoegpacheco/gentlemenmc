#!/usr/bin/env node
/**
 * Envia mensagem de teste via Telegram Bot API
 * Uso: npm run test:telegram
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvLocal();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const TEST_MESSAGE =
  "🧪 [TESTE] Gentlemen MC — alerta de empréstimo Sede (pode ignorar)";

console.log("\n📱 Teste Telegram — empréstimo Sede\n");

if (!token) {
  console.log("❌ TELEGRAM_BOT_TOKEN não definido\n");
  process.exit(1);
}

if (chatIds.length === 0) {
  console.log("❌ TELEGRAM_CHAT_ID não definido");
  console.log("   Rode: npm run telegram:chat-id\n");
  process.exit(1);
}

let ok = 0;
for (const chatId of chatIds) {
  console.log(`Enviando para chat ${chatId}...`);
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: TEST_MESSAGE }),
  });
  const data = await res.json();
  if (data.ok) {
    console.log(`✅ OK\n`);
    ok++;
  } else {
    console.log(`❌ ${data.description ?? res.statusText}\n`);
  }
}

process.exit(ok > 0 ? 0 : 1);
