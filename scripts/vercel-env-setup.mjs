#!/usr/bin/env node
/**
 * Sync env vars from .env.local to Vercel (production, preview, development).
 * Creates missing vars, skips unchanged values, updates when different.
 *
 * Requires: vercel login (or VERCEL_TOKEN) and linked project (vercel link).
 *
 * Usage:
 *   npm run vercel:env
 *   npm run vercel:env -- --only EMPRESTIMO_NOTIFY_EMAILS
 */
import {
  readFileSync,
  writeFileSync,
  existsSync,
  unlinkSync,
  mkdirSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");
const vercelDir = resolve(root, ".vercel");
const syncStatePath = resolve(vercelDir, "env-sync-state.json");

const ENVIRONMENTS = ["production", "preview", "development"];

const VARS = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", sensitive: false },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", sensitive: false },
  { key: "SUPABASE_SERVICE_ROLE_KEY", sensitive: true },
  { key: "TELEGRAM_BOT_TOKEN", sensitive: true },
  { key: "TELEGRAM_CHAT_ID", sensitive: false },
  {
    key: "EMPRESTIMO_NOTIFY_EMAILS",
    sensitive: false,
    defaultValue: "robson@gentlemenmc.com.br",
  },
];

function parseArgs(argv) {
  const onlyIndex = argv.indexOf("--only");
  if (onlyIndex === -1) return null;
  const value = argv[onlyIndex + 1];
  if (!value) {
    console.error("❌ --only requires a variable name\n");
    process.exit(1);
  }
  return value;
}

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

function hashValue(value) {
  return createHash("sha256").update(value).digest("hex");
}

function loadSyncState() {
  if (!existsSync(syncStatePath)) return {};
  try {
    return JSON.parse(readFileSync(syncStatePath, "utf8"));
  } catch {
    return {};
  }
}

function saveSyncState(state) {
  mkdirSync(vercelDir, { recursive: true });
  writeFileSync(syncStatePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function run(cmd, args, input) {
  return spawnSync(cmd, args, {
    cwd: root,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function vercel(args, input) {
  const local = resolve(root, "node_modules", ".bin", "vercel");
  if (existsSync(local)) return run(local, args, input);

  const global = run("vercel", args, input);
  if (global.error?.code !== "ENOENT") return global;

  return run("npx", ["--yes", "vercel", ...args], input);
}

function checkAuth() {
  const r = vercel(["whoami"]);
  if (r.status !== 0) {
    console.error("❌ Vercel CLI not authenticated.\n");
    console.error("   Run: vercel login");
    console.error("   Or export VERCEL_TOKEN=<token from dashboard>\n");
    process.exit(1);
  }
  console.log(`✓ Vercel: ${r.stdout.trim()}\n`);
}

function ensureLinked() {
  const r = vercel(["link", "--yes"]);
  if (r.status !== 0) {
    console.error((r.stderr || r.stdout).trim());
    console.error("\n❌ Link failed. Run manually: vercel link\n");
    process.exit(1);
  }
}

function pullRemoteEnv(environment) {
  const tmpPath = resolve(
    tmpdir(),
    `vercel-env-${environment}-${randomBytes(6).toString("hex")}.tmp`
  );

  const r = vercel(["env", "pull", tmpPath, "--environment", environment, "-y"]);
  if (r.status !== 0) {
    console.warn(`  ! could not pull ${environment} env (treating as empty)`);
    return {};
  }

  const parsed = loadDotEnv(tmpPath);
  try {
    unlinkSync(tmpPath);
  } catch {
    // ignore cleanup errors
  }
  return parsed;
}

function pullAllRemoteEnvs() {
  const remote = {};
  for (const env of ENVIRONMENTS) {
    remote[env] = pullRemoteEnv(env);
  }
  return remote;
}

function isSensitiveForEnv(sensitive, env) {
  return sensitive && env !== "development";
}

function addEnv(key, value, env, sensitive) {
  const args = [
    "env",
    "add",
    key,
    env,
    "--value",
    value,
    "--yes",
  ];
  if (isSensitiveForEnv(sensitive, env)) args.push("--sensitive");
  else args.push("--no-sensitive");

  const r = vercel(args);
  if (r.status === 0) {
    console.log(`  ✓ added ${key} → ${env}`);
    return true;
  }
  const err = (r.stderr || r.stdout || "").trim();
  console.error(`  ✗ add ${key} → ${env}: ${err}`);
  return false;
}

function updateEnv(key, value, env, sensitive) {
  const args = [
    "env",
    "update",
    key,
    env,
    "--value",
    value,
    "--yes",
  ];
  if (isSensitiveForEnv(sensitive, env)) args.push("--sensitive");

  const r = vercel(args);
  if (r.status === 0) {
    console.log(`  ↻ updated ${key} → ${env}`);
    return true;
  }
  const err = (r.stderr || r.stdout || "").trim();
  console.error(`  ✗ update ${key} → ${env}: ${err}`);
  return false;
}

function syncEnv(key, value, env, { sensitive }, remoteEnv, syncState) {
  const stateKey = `${key}:${env}`;
  const localHash = hashValue(value);
  const exists = Object.prototype.hasOwnProperty.call(remoteEnv, key);
  const remoteValue = remoteEnv[key];
  const remoteIsMasked = exists && remoteValue === "";

  if (!exists) {
    const ok = addEnv(key, value, env, sensitive);
    if (ok) syncState[stateKey] = localHash;
    return ok;
  }

  if (!remoteIsMasked && remoteValue === value) {
    syncState[stateKey] = localHash;
    console.log(`  = ${key} unchanged in ${env}`);
    return true;
  }

  if (remoteIsMasked && syncState[stateKey] === localHash) {
    console.log(`  = ${key} unchanged in ${env} (encrypted)`);
    return true;
  }

  const ok = updateEnv(key, value, env, sensitive);
  if (ok) syncState[stateKey] = localHash;
  return ok;
}

function resolveValue(local, spec) {
  const value = local[spec.key] ?? spec.defaultValue;
  if (!value) return null;
  return value;
}

function verifyParity(keys) {
  console.log("Verifying parity across environments…\n");
  const remoteByEnv = pullAllRemoteEnvs();
  let parityOk = true;

  for (const key of keys) {
    const valuesByEnv = {};
    for (const env of ENVIRONMENTS) {
      valuesByEnv[env] = remoteByEnv[env][key];
    }

    const missing = ENVIRONMENTS.filter(
      (env) => !Object.prototype.hasOwnProperty.call(remoteByEnv[env], key)
    );
    if (missing.length > 0) {
      console.error(`  ✗ ${key} missing in: ${missing.join(", ")}`);
      parityOk = false;
      continue;
    }

    const readable = ENVIRONMENTS.map((env) => valuesByEnv[env]).filter(
      (value) => value !== ""
    );
    const uniqueReadable = [...new Set(readable)];

    if (uniqueReadable.length > 1) {
      console.error(`  ✗ ${key} has different values between environments`);
      parityOk = false;
      continue;
    }

    console.log(`  ✓ ${key} present in all environments`);
  }

  console.log("");
  return parityOk;
}

function main() {
  const only = parseArgs(process.argv.slice(2));
  const selectedVars = only ? VARS.filter((v) => v.key === only) : VARS;

  if (only && selectedVars.length === 0) {
    console.error(`❌ Unknown variable: ${only}\n`);
    process.exit(1);
  }

  console.log("Vercel — environment variables\n");

  checkAuth();
  ensureLinked();

  const local = loadDotEnv(envPath);
  const missingRequired = selectedVars
    .filter((spec) => !spec.optional)
    .filter((spec) => !resolveValue(local, spec));
  if (missingRequired.length > 0) {
    console.error(
      `❌ Missing in .env.local: ${missingRequired.map((s) => s.key).join(", ")}\n`
    );
    process.exit(1);
  }

  console.log("Fetching remote values…\n");
  const remoteByEnv = pullAllRemoteEnvs();
  const syncState = loadSyncState();

  let ok = true;
  for (const spec of selectedVars) {
    const value = resolveValue(local, spec);
    if (!value) {
      if (spec.optional) {
        console.log(`~ ${spec.key} not in .env.local (optional)\n`);
        continue;
      }
      console.error(`❌ ${spec.key} missing in .env.local\n`);
      process.exit(1);
    }

    console.log(`${spec.key}:`);
    for (const env of ENVIRONMENTS) {
      if (
        !syncEnv(spec.key, value, env, spec, remoteByEnv[env], syncState)
      ) {
        ok = false;
      }
    }
    console.log("");
  }

  saveSyncState(syncState);

  if (!ok) {
    console.error("Some variables failed. See above.\n");
    process.exit(1);
  }

  const parityOk = verifyParity(selectedVars.map((spec) => spec.key));
  if (!parityOk) {
    console.error("Parity check failed. Re-run npm run vercel:env\n");
    process.exit(1);
  }

  console.log("Done. All synced variables match across development, preview, and production.");
  console.log("Redeploy production to apply:");
  console.log("  vercel --prod\n");
}

main();
