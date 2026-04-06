import fs from "fs";
import path from "path";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

const SESSION_DIR = "./auth_info";
const COMMANDS_DIR = path.join(process.cwd(), "commands");

// TU NÚMERO OWNER, sin +
const OWNER_NUMBER = "573223090406";

async function loadCommands() {
  const commands = new Map();

  if (!fs.existsSync(COMMANDS_DIR)) {
    fs.mkdirSync(COMMANDS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(COMMANDS_DIR).filter(file => file.endsWith(".js"));

  for (const file of files) {
    const fullPath = path.join(COMMANDS_DIR, file);
    const module = await import(`file://${fullPath}`);
    const cmd = module.default;

    if (!cmd?.name || typeof cmd.run !== "function") continue;

    commands.set(cmd.name, cmd);

    if (Array.isArray(cmd.aliases)) {
      for (const alias of cmd.aliases) {
        commands.set(alias, cmd);
      }
    }
  }

  return commands;
}

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
  return String(jid).split("@")[0].replace(/D/g, "");
}

function getSenderCandidates(msg) {
  return [
    msg?.key?.participantPn,
    msg?.key?.participantAlt,
    msg?.key?.participant,
    msg?.key?.remoteJidAlt,
    msg?.key?.remoteJid,
    msg?.participant,
    msg?.sender,
  ].filter(Boolean);
}

function isOwnerMessage(msg) {
  // si el mensaje es enviado por la cuenta vinculada, es del owner
  if (msg?.key?.fromMe) return true;

  const candidates = getSenderCandidates(msg);
  return candidates.some(jid => normalizeJidToNumber(jid) === OWNER_NUMBER);
}

async function startBot() {
  const commands = await loadCommands();
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  console.log(
    "✅ Comandos cargados:",
    [...new Set([...commands.values()].map(c => c.name))].join(", ")
  );
  console.log("✅ Usando versión WA:", version);

  const logger = pino({ level: "silent" });
  logger.child = () => logger;

  const sock = makeWASocket({
    version,
    browser: Browsers.ubuntu("Chrome"),
    logger,
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.clear();
      console.log("📲 Escanea este QR con WhatsApp > Dispositivos vinculados");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "connecting") {
      console.log("⏳ Conectando...");
    }

    if (connection === "open") {
      console.log("✅ Bot conectado");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log("❌ Conexión cerrada. Reconectar:", shouldReconnect);

      if (shouldReconnect) {
        setTimeout(() => startBot(), 3000);
      } else {
        console.log("⚠️ Sesión cerrada. Borra auth_info si quieres volver a vincular.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const body = getTextMessage(msg).trim();
    if (!body.startsWith(".")) return;

    if (!isOwnerMessage(msg)) return;

    const [rawCmd, ...args] = body.slice(1).trim().split(/s+/);
    const commandName = rawCmd?.toLowerCase();
    if (!commandName) return;

    const command = commands.get(commandName);
    if (!command) return;

    try {
      console.log(`🟡 Ejecutando comando: ${commandName}`);
      console.log("👤 fromMe:", msg.key?.fromMe);
      console.log("👤 sender candidates:", getSenderCandidates(msg));
      console.log("📍 chat:", msg.key?.remoteJid);

      await command.run(sock, msg, args, msg.key.remoteJid);
    } catch (e) {
      console.log(`❌ Error en comando ${commandName}:`, e?.message || e);
    }
  });
}

startBot();
