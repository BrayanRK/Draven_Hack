import fs from "fs";
import path from "path";
import readline from "readline";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  normalizeMessageContent,
} from "@whiskeysockets/baileys";
import pino from "pino";
import config from "./config.js";


import log from "./logger.js";
import { downloadAndSave } from "./commands/media/vv.js";
import { registerAntiDelete } from "./plugins/antiDelete.js";

// ─── Config base (sin número, ese se guarda aparte) ───────────────────────────
const SESSION_DIR     = "./auth_info";
const COMMANDS_DIR    = path.join(process.cwd(), "commands");
const SESSION_FILE    = "./session.json";  // guarda número del owner
const PREFIX          = ".";
const QUEUE_DELAY     = 1200;
const DEF_COOLDOWN    = 3000;
const RELOAD_DEBOUNCE = 500;
const MSG_STORE_LIMIT = 200;
// ──────────────────────────────────────────────────────────────────────────────

function askQuestion(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

async function getOwnerNumber() {
  if (fs.existsSync(SESSION_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
      if (data.ownerNumber) return data.ownerNumber;
    } catch {}
  }

  console.clear();
  console.log("╔════════════════════════════════════════╗");
  console.log("   🤖  DRAVEN_HACK BOT — Configuración    ");
  console.log("╚════════════════════════════════════════╝\n");
  console.log("  Solo necesitas hacer esto UNA VEZ.\n");

  let number = "";
  while (!number || !/^\d{10,15}$/.test(number)) {
    number = await askQuestion("  📱 Tu número (con código de país, sin +):\n  Ej: 5732XXXXXXXX → ");
    if (!/^\d{10,15}$/.test(number)) {
      console.log("  ❌ Número inválido, intenta de nuevo.\n");
    }
  }

  fs.writeFileSync(SESSION_FILE, JSON.stringify({ ownerNumber: number }, null, 2));
  console.log(`\n  ✅ Número guardado: ${number}`);
  console.log("  (No te volverá a preguntar esto)\n");

  return number;
}

// ══════════════════════════════════════════════════════════════════════════════
//  CARGA DE COMANDOS
// ══════════════════════════════════════════════════════════════════════════════
async function loadCommands() {
  const commands = new Map();
  if (!fs.existsSync(COMMANDS_DIR)) fs.mkdirSync(COMMANDS_DIR, { recursive: true });

  const getFiles = (dir) => {
    let results = [];
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const res = path.join(dir, item.name);
      if (item.isDirectory()) results = results.concat(getFiles(res));
      else if (item.isFile() && item.name.endsWith(".js")) results.push(res);
    }
    return results;
  };

  for (const fullPath of getFiles(COMMANDS_DIR)) {
    try {
      const module = await import(`file://${fullPath}?update=${Date.now()}`);
      const cmd = module.default;
      if (!cmd?.name || typeof cmd.run !== "function") continue;
      commands.set(cmd.name, cmd);
      if (Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) commands.set(alias, cmd);
      }
    } catch (e) {
      log.error(`Error cargando ${fullPath}:`, e.message);
    }
  }
  return commands;
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTO-RELOAD
// ══════════════════════════════════════════════════════════════════════════════
function setupAutoReload(commands) {
  let debounceTimer = null;
  fs.watch(COMMANDS_DIR, { recursive: true }, async (event, filename) => {
    if (!filename?.endsWith(".js")) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      log.info(`Cambio en: ${filename} — Recargando...`);
      try {
        const fresh = await loadCommands();
        commands.clear();
        fresh.forEach((v, k) => commands.set(k, v));
        log.ok("Recargados:", [...new Set([...commands.values()].map((c) => c.name))].join(", "));
      } catch (e) {
        log.error("Error en auto-reload:", e.message);
      }
    }, RELOAD_DEBOUNCE);
  });
  log.ok("Auto-reload activo en /commands");
}

// ══════════════════════════════════════════════════════════════════════════════
//  COLA ANTI-BAN
// ══════════════════════════════════════════════════════════════════════════════
const messageQueue = [];
let queueRunning = false;

function enqueue(task) {
  messageQueue.push(task);
  if (!queueRunning) processQueue();
}

async function processQueue() {
  if (messageQueue.length === 0) { queueRunning = false; return; }
  queueRunning = true;
  const task = messageQueue.shift();
  try { await task(); } catch (e) { log.error("Error en cola:", e.message); }
  await new Promise((r) => setTimeout(r, QUEUE_DELAY));
  processQueue();
}

// ══════════════════════════════════════════════════════════════════════════════
//  COOLDOWNS
// ══════════════════════════════════════════════════════════════════════════════
const cooldowns = new Map();
function isOnCooldown(name, ms) {
  const last = cooldowns.get(name);
  return last ? Date.now() - last < ms : false;
}
function setCooldown(name) { cooldowns.set(name, Date.now()); }

// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function getTextMessage(msg) {
  return (
    msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.message?.imageMessage?.caption ||
    msg?.message?.videoMessage?.caption ||
    ""
  );
}

function normalizeJidToNumber(jid = "") {
  return String(jid).split("@")[0].replace(/\D/g, "");
}

function isOwnerMessage(
  msg,
  ownerNumber,
  superOwner
) {

  if (msg?.key?.fromMe) {
    return true;
  }

  const jid =
    msg?.key?.participantAlt ||
    msg?.key?.remoteJidAlt ||
    msg?.key?.participant ||
    msg?.key?.remoteJid ||
    "";

  const senderNumber =
    normalizeJidToNumber(jid);

  return (
    String(senderNumber) === String(ownerNumber) ||
    String(senderNumber) === String(superOwner)
  );
}

function findViewOnceMedia(message) {
  if (!message) return null;
  const inner =
    message.viewOnceMessage?.message ||
    message.viewOnceMessageV2?.message ||
    message.viewOnceMessageV2Extension?.message;
  if (!inner) return null;
  if (inner.imageMessage) return { type: "image", message: inner };
  if (inner.videoMessage) return { type: "video", message: inner };
  if (inner.audioMessage) return { type: "audio", message: inner };
  return null;
}

function getRealSender(msg) {
  return msg?.key?.participant || msg?.key?.remoteJid || "desconocido";
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTO-REPARACIÓN DE SESIÓN
// ══════════════════════════════════════════════════════════════════════════════
function clearSession() {
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      log.warn("Sesión borrada automáticamente.");
    }
  } catch (e) {
    log.error("No se pudo borrar la sesión:", e.message);
  }
}

let sessionRetries = 0;
const MAX_SESSION_RETRIES = 3;

// ══════════════════════════════════════════════════════════════════════════════
//  BOT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
async function startBot() {
  const OWNER_NUMBER = await getOwnerNumber();

  let state, saveCreds;
  try {
    ({ state, saveCreds } = await useMultiFileAuthState(SESSION_DIR));
  } catch (e) {
    log.error("Sesión corrupta:", e.message);
    if (sessionRetries < MAX_SESSION_RETRIES) {
      sessionRetries++;
      log.warn(`Auto-reparando... (${sessionRetries}/${MAX_SESSION_RETRIES})`);
      clearSession();
      setTimeout(() => startBot(), 2000);
    } else {
      log.error("No se pudo reparar. Borra auth_info manualmente y reinicia.");
    }
    return;
  }

  const commands = await loadCommands();
  log.ok("Comandos cargados:", [...new Set([...commands.values()].map((c) => c.name))].join(", "));
  setupAutoReload(commands);

  const { version } = await fetchLatestBaileysVersion();
  log.ok("Usando versión WA:", version);

  const logger = pino({ level: "silent" });
  logger.child = () => logger;

  const sock = makeWASocket({
    version,
    browser: Browsers.ubuntu("Chrome"),
    logger,
    auth: state,
    printQRInTerminal: false,
    getMessage: async (key) => {
      if (sock.msgStore?.has(key.id)) {
        return sock.msgStore.get(key.id)?.message || { conversation: "" };
      }
      return { conversation: "" };
    },
  });

  sock.msgStore = new Map();

  sock.ev.on("creds.update", saveCreds);

  // ── Vinculación automática por código ────────────────────────────────────
  if (!state.creds.registered) {
    log.info(`Solicitando código para: ${OWNER_NUMBER}`);
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const code = await sock.requestPairingCode(OWNER_NUMBER);
      console.clear();
      console.log("\n╔══════════════════════════════════════╗");
      console.log(`   🔑 CÓDIGO DE VINCULACIÓN: ${code}   `);
      console.log("╚══════════════════════════════════════╝");
      console.log("\n  WhatsApp > Dispositivos vinculados");
      console.log("  > Vincular con número de teléfono\n");
      log.info("Esperando confirmación...");
    } catch (e) {
      log.error("Error al pedir código:", e.message);
      log.warn("Reinicia el bot e intenta de nuevo.");
    }
  }

  // ── Eventos de conexión ───────────────────────────────────────────────────
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") { log.info("Conectando..."); return; }

    if (connection === "open") {
      sessionRetries = 0;
      console.clear();
      log.ok("✅ Bot conectado y listo!");
      registerAntiDelete(sock);
      return;
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut  = code === DisconnectReason.loggedOut;
      const isBadSession = code === DisconnectReason.badSession;
      const isConflict   = code === DisconnectReason.connectionReplaced;

      if (isLoggedOut || isBadSession) {
        log.warn(`Sesión inválida (${code}). Borrando y reconectando...`);
        clearSession();
        if (sessionRetries < MAX_SESSION_RETRIES) {
          sessionRetries++;
          setTimeout(() => startBot(), 3000);
        } else {
          log.error("Demasiados intentos. Reinicia manualmente.");
        }
      } else if (isConflict) {
        log.warn("Bot abierto en otro lugar. Cerrando esta instancia.");
      } else {
        log.warn(`Conexión cerrada (${code}). Reconectando en 3s...`);
        setTimeout(() => startBot(), 3000);
      }
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  LISTENER PRINCIPAL
  // ══════════════════════════════════════════════════════════════════════════
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    // ── BLOQUE 1: ViewOnce automático ─────────────────────────────────────
    if (!msg.key.fromMe) {
      const normalized = normalizeMessageContent(msg.message);
      const media = findViewOnceMedia(normalized);
      if (media) {
        const senderJid = getRealSender(msg);
        log.auto(`ViewOnce de: ${normalizeJidToNumber(senderJid)}`);
        downloadAndSave(sock, { key: msg.key, message: normalized }, media, senderJid)
          .catch((e) => log.error("Auto-vv:", e.message));
      }
    }

    // ── BLOQUE 2: Comandos ────────────────────────────────────────────────
    const body = getTextMessage(msg).trim();

    const stanzaId = msg?.key?.id;
    if (stanzaId && msg.message) {
      sock.msgStore.set(stanzaId, msg);
      if (sock.msgStore.size > MSG_STORE_LIMIT) {
        sock.msgStore.delete(sock.msgStore.keys().next().value);
      }
    }

    // aceptar con y sin prefijo
    const usedPrefix = body.startsWith(PREFIX);
    const text = usedPrefix ? body.slice(PREFIX.length).trim() : body.trim();
    if (!text) return;

    if (!isOwnerMessage(
      msg,
      OWNER_NUMBER,
      config.superOwner
   )) {

     log.ban("Ignorado: no es owner");

     return;
}

    const [rawCmd, ...args] = text.split(/\s+/);
    const commandName = rawCmd?.toLowerCase();
    if (!commandName) return;

    const command = commands.get(commandName);
    if (!command) return;

    const cooldownMs = command.cooldown ?? DEF_COOLDOWN;
    if (isOnCooldown(commandName, cooldownMs)) {
      const rem = ((cooldownMs - (Date.now() - cooldowns.get(commandName))) / 1000).toFixed(1);
      log.warn(`Cooldown "${commandName}": ${rem}s restantes`);
      return;
    }
    setCooldown(commandName);

    enqueue(async () => {
      log.cmd(`Ejecutando: ${commandName}`);
      try {
        await command.run(sock, msg, args, msg.key.remoteJid);
      } catch (e) {
        log.error(`Error en ${commandName}:`, e?.message || e);
      }
    });
  }); // <- cierra sock.ev.on("messages.upsert")

} // <- cierra startBot()

startBot();