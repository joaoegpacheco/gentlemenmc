#!/usr/bin/env node
/**
 * Adiciona variáveis do Telegram (e opcionalmente Supabase) na Vercel.
 * Requer: vercel login (ou VERCEL_TOKEN) e projeto linkado (vercel link).
 *
 * Uso: npm run vercel:env
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

const ENVIRONMENTS = ["production", "preview", "development"];

const VARS = [
  { key: "TELEGRAM_BOT_TOKEN", sensitive: true },
  { key: "TELEGRAM_CHAT_ID", sensitive: false },
  { key: "SUPABASE_SERVICE_ROLE_KEY", sensitive: true, optional: true },
];

function loadDotEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
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
    out[key] = val;
  }
  return out;
}

function run(cmd, args, input) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return r;
}

function vercel(args, input) {
  return run("vercel", args, input);
}

function checkAuth() {
  const r = vercel(["whoami"]);
  if (r.status !== 0) {
    console.error("❌ Vercel CLI não autenticada.\n");
    console.error("   Execute: vercel login");
    console.error("   Ou exporte VERCEL_TOKEN=<token da dashboard>\n");
    process.exit(1);
  }
  console.log(`✓ Vercel: ${r.stdout.trim()}\n`);
}

function listExisting(key, env) {
  const r = vercel(["env", "ls", env]);
  return r.stdout.includes(key);
}

function addEnv(key, value, env, sensitive) {
  const args = ["env", "add", key, env];
  if (sensitive) args.push("--sensitive");
  const r = vercel(args, value);
  if (r.status === 0) {
    console.log(`  ✓ ${key} → ${env}`);
    return true;
  }
  const err = (r.stderr || r.stdout || "").trim();
  if (err.includes("already exists") || err.includes("A variable with")) {
    console.log(`  ~ ${key} já existe em ${env} (pulando)`);
    return true;
  }
  console.error(`  ✗ ${key} → ${env}: ${err}`);
  return false;
}

function main() {
  console.log("Vercel — variáveis Telegram\n");

  checkAuth();

  const local = loadDotEnv(envPath);
  if (!local.TELEGRAM_BOT_TOKEN || !local.TELEGRAM_CHAT_ID) {
    console.error("❌ TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID são obrigatórios em .env.local\n");
    process.exit(1);
  }

  const linked = existsSync(resolve(root, ".vercel", "project.json"));
  if (!linked) {
    console.log("Projeto não linkado. Executando vercel link…\n");
    const r = vercel(["link", "--yes"]);
    if (r.status !== 0) {
      console.error((r.stderr || r.stdout).trim());
      console.error("\n❌ Falha ao linkar. Rode manualmente: vercel link\n");
      process.exit(1);
    }
  }

  let ok = true;
  for (const { key, sensitive, optional } of VARS) {
    const value = local[key];
    if (!value) {
      if (optional) {
        console.log(`~ ${key} não está no .env.local (opcional)\n`);
        continue;
      }
      console.error(`❌ ${key} ausente em .env.local\n`);
      process.exit(1);
    }
    console.log(`${key}:`);
    for (const env of ENVIRONMENTS) {
      if (listExisting(key, env)) {
        console.log(`  ~ ${key} já listado em ${env} (pulando)`);
        continue;
      }
      if (!addEnv(key, value, env, sensitive)) ok = false;
    }
    console.log("");
  }

  if (!ok) {
    console.error("Algumas variáveis falharam. Veja acima.\n");
    process.exit(1);
  }

  console.log("Concluído. Faça redeploy em Production para aplicar:");
  console.log("  vercel --prod\n");
  console.log("Ou no dashboard: Settings → Environment Variables → Redeploy\n");
}

main();
