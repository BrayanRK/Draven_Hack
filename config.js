// ═══════════════════════════════════════════════════════
//   config.js — Configuración central de DravenHack Bot
//   Edita aquí sin tocar index.js ni los comandos
// ═══════════════════════════════════════════════════════

export default {

  // ── Identidad ──────────────────────────────────────────
  ownerNumber: "",   // Tu número sin + ni espacios
  prefix: ".",                   // Prefijo de comandos

  // ── Sesión ────────────────────────────────────────────
  sessionDir: "./auth_info",
  commandsDir: "./commands",

  // ── Anti-ban: cola de mensajes ─────────────────────────
  // Tiempo mínimo entre mensajes enviados por el bot (ms)
  // 1200 es seguro, no bajes de 800
  queueDelay: 1200,

  // ── Cooldowns ─────────────────────────────────────────
  // Tiempo mínimo entre ejecuciones del mismo comando (ms)
  // Se puede sobreescribir en cada comando con: cooldown: 5000
  defaultCooldown: 3000,

  // ── Logger ────────────────────────────────────────────
  logFile: "./bot.log",          // Ruta del archivo de log
  maxLogSizeMB: 5,               // Rota el log si supera este tamaño

  // ── Auto-reload ───────────────────────────────────────
  // Tiempo de espera después de detectar un cambio antes de recargar (ms)
  // Evita recargas múltiples si guardas varias veces seguido
  reloadDebounce: 500,
};