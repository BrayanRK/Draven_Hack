// ═══════════════════════════════════════════════════════
//   logger.js — Logger persistente con rotación
//   Guarda todo en bot.log sin perder nada al cerrar
// ═══════════════════════════════════════════════════════

import fs from "fs";
import config from "./config.js";

const LOG_FILE = config.logFile;
const MAX_BYTES = config.maxLogSizeMB * 1024 * 1024;

// Rota el log si está muy grande (renombra a bot.log.old)
function rotatIfNeeded() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const { size } = fs.statSync(LOG_FILE);
      if (size >= MAX_BYTES) {
        fs.renameSync(LOG_FILE, LOG_FILE + ".old");
      }
    }
  } catch {}
}

// Stream que se abre una vez y se reutiliza
let _stream = null;
function getStream() {
  if (!_stream || _stream.destroyed) {
    rotatIfNeeded();
    _stream = fs.createWriteStream(LOG_FILE, { flags: "a" });
  }
  return _stream;
}

// Niveles de log con emoji
const LEVELS = {
  info:  "ℹ️ ",
  ok:    "✅",
  warn:  "⚠️ ",
  error: "❌",
  cmd:   "🟡",
  auto:  "👁️ ",
  ban:   "🚫",
  queue: "📬",
};

function write(level, ...parts) {
  const emoji = LEVELS[level] || "•";
  const text = parts.map(String).join(" ");
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const line = `[${timestamp}] ${emoji} ${text}`;

  // Consola siempre
  console.log(line);

  // Archivo (no bloquea el event loop)
  try {
    getStream().write(line + "\n");
  } catch {}
}

// API pública
const log = {
  info:  (...a) => write("info",  ...a),
  ok:    (...a) => write("ok",    ...a),
  warn:  (...a) => write("warn",  ...a),
  error: (...a) => write("error", ...a),
  cmd:   (...a) => write("cmd",   ...a),
  auto:  (...a) => write("auto",  ...a),
  ban:   (...a) => write("ban",   ...a),
  queue: (...a) => write("queue", ...a),
};

export default log;