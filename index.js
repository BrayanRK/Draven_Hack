import fs from "fs";
import path from "path";
import readline from "readline";
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
const OWNER_NUMBER = "573223090406"; // Tu número sin +

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text) =>
  new Promise((resolve) => rl.question(text, resolve));

async function loadCommands() {
  const commands = new Map();

  if (!fs.existsSync(COMMANDS_DIR)) {
    fs.mkdirSync(COMMANDS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(COMMANDS_DIR).filter((file) =>
    file.endsWith(".js")
  );

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
  return String(jid).split("@")[0].replace(/\D/g, "");
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
  // ✅ SOLO TUS MENSAJES (fromMe) + tu número
  if (!msg?.key?.fromMe) return false; // Debe ser TU mensaje
  const candidates = getSenderCandidates(msg);
  return candidates.some((jid) => normalizeJidToNumber(jid) === OWNER_NUMBER);
}

async function startBot() {
  const commands = await loadCommands();
  console.log(
    "✅ Comandos cargados:",
    [...new Set([...commands.values()].map((c) => c.name))].join(", ")
  );

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  console.log("✅ Usando versión WA:", version);

  const logger = pino({ level: "silent" });
  logger.child = () => logger;

  const sock = makeWASocket({
    version,
    browser: Browsers.ubuntu("Chrome"),
    logger,
    auth: state,
    printQRInTerminal: false, // Necesario para código
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "connecting") {
      console.log("⏳ Conectando...");
      return;
    }

    if (qr) {
      console.clear();
      console.log("📲 Escanea este QR con WhatsApp > Dispositivos vinculados");
      qrcode.generate(qr, { small: true });
      return;
    }

    if (connection === "open") {
      console.log("✅ Bot conectado y listo!");
      return;
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Conexión cerrada. Reconectar:", shouldReconnect);
      if (shouldReconnect) {
        setTimeout(() => startBot(), 3000);
      } else {
        console.log("⚠️ Sesión cerrada. Borra auth_info si quieres reconectar.");
      }
      return;
    }
  });

  // 🚀 NUEVO: Menú QR o Código
  if (!state.creds.registered) {
    const choice = await question(
      "🔐 ¿Cómo conectar? (1=QR, 2=Código): "
    );

    if (choice === "2") {
      // Código de pairing
      const phone = await question(
        "📱 Tu número (solo dígitos, ej: 573223090406): "
      );
      try {
        const code = await sock.requestPairingCode(phone);
        console.clear();
        console.log(`\n🔑 CÓDIGO DE VINCULACIÓN: ${code}\n`);
        console.log(
          "📱 En WhatsApp > Dispositivos vinculados > Vincular con número de teléfono"
        );
        console.log("⏳ Esperando confirmación...");
      } catch (e) {
        console.log("❌ Error generando código:", e.message);
        rl.close();
        return;
      }
    } else {
      // QR (tu código original)
      console.log("📲 Esperando QR...");
    }
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const body = getTextMessage(msg).trim();
    if (!body.startsWith(".")) return;

    // ✅ VERIFICACIÓN ESTRICTA: SOLO TUS MENSAJES
    if (!isOwnerMessage(msg)) {
      console.log("🚫 Comando ignorado: no es del owner");
      return;
    }

    const [rawCmd, ...args] = body.slice(1).trim().split(/\s+/);
    const commandName = rawCmd?.toLowerCase();
    if (!commandName) return;

    const command = commands.get(commandName);
    if (!command) return;

    try {
      console.log(`🟡 Ejecutando: ${commandName} por owner`);
      await command.run(sock, msg, args, msg.key.remoteJid);
    } catch (e) {
      console.log(`❌ Error en ${commandName}:`, e?.message || e);
    }
  });
}

startBot();