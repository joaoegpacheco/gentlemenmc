#!/usr/bin/env node
/**
 * Descobre chat_id após enviar /start ao bot no Telegram
 * Uso: npm run telegram:chat-id
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

console.log("\n📱 Telegram — descobrir chat_id\n");

if (!token) {
  console.log("❌ TELEGRAM_BOT_TOKEN não definido no .env.local\n");
  console.log("Passos:");
  console.log("  1. Abra @BotFather no Telegram");
  console.log("  2. /newbot → escolha nome e username");
  console.log("  3. Copie o token para .env.local:\n");
  console.log("     TELEGRAM_BOT_TOKEN=123456789:ABCdef...\n");
  process.exit(1);
}

console.log("1. Abra seu bot no Telegram");
console.log("2. Envie: /start");
console.log("3. Buscando mensagens recentes...\n");

const res = await fetch(
  `https://api.telegram.org/bot${token}/getUpdates?limit=10`
);
const data = await res.json();

if (!data.ok) {
  console.log(`❌ Erro: ${data.description}\n`);
  process.exit(1);
}

const chats = new Map();

for (const update of data.result ?? []) {
  const msg = update.message ?? update.edited_message;
  if (!msg?.chat) continue;
  const chat = msg.chat;
  const key = String(chat.id);
  chats.set(key, {
    id: chat.id,
    type: chat.type,
    name:
      [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
      chat.title ||
      chat.username ||
      key,
    username: chat.username,
  });
}

if (chats.size === 0) {
  console.log("⚠️  Nenhuma conversa encontrada.");
  console.log("   Envie /start ao bot e rode este comando de novo.\n");
  process.exit(1);
}

console.log("Chat IDs encontrados:\n");
for (const chat of chats.values()) {
  console.log(`  TELEGRAM_CHAT_ID=${chat.id}`);
  console.log(`    Nome: ${chat.name}`);
  if (chat.username) console.log(`    @${chat.username}`);
  console.log(`    Tipo: ${chat.type}\n`);
}

console.log("Adicione ao .env.local e rode: npm run test:telegram\n");
