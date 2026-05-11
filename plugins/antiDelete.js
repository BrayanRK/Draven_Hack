// plugins/antiDelete.js

const TYPE_LABELS = {
  conversation:               "💬 Texto",
  extendedTextMessage:        "💬 Texto",
  imageMessage:               "🖼️ Imagen",
  videoMessage:               "🎥 Video",
  audioMessage:               "🎵 Audio",
  documentMessage:            "📄 Documento",
  documentWithCaptionMessage: "📄 Documento",
  stickerMessage:             "🎭 Sticker",
  contactMessage:             "👤 Contacto",
  locationMessage:            "📍 Ubicación",
  pollCreationMessage:        "📊 Encuesta",
};

// ── Estado interno ─────────────────────────────────────────────────────────
let active = true; // Activo por defecto al arrancar

export function toggleAntiDelete(state) {
  active = state;
  console.log(`[antiDelete] ${active ? "✅ Activado" : "❌ Desactivado"}`);
}

export function isAntiDeleteActive() {
  return active;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function detectType(msg) {
  const content = msg?.message;
  if (!content) return "❓ Desconocido";
  const key = Object.keys(content).find((k) => TYPE_LABELS[k]);
  return key ? TYPE_LABELS[key] : `🗂️ Archivo (${Object.keys(content)[0]})`;
}

function getCaption(msg) {
  const m = msg?.message;
  if (!m) return "";
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ""
  );
}

// ── Registro del listener ─────────────────────────────────────────────────
export function registerAntiDelete(sock) {
  sock.ev.on("messages.update", async (updates) => {
    // Respetar estado on/off
    if (!active) return;

    const botJid = sock.user?.id?.replace(/:.*@/, "@") ?? null;
    if (!botJid) return;

    for (const { key, update } of updates) {
      try {
        if (update.messageStubType !== 1) continue;

        const cached = sock.msgStore?.get(key.id);
        if (!cached) continue;

        const chatJid   = key.remoteJid;
        const isGroup   = chatJid?.endsWith("@g.us");
        const sender    = key.participant || chatJid;
        const senderNum = sender?.split("@")[0] ?? "desconocido";

        if (sender === botJid) continue;

        const tipo      = detectType(cached);
        const caption   = getCaption(cached);
        const chatLabel = isGroup ? `👥 Grupo` : `💬 Chat privado`;
        const hora = new Date(Number(cached.messageTimestamp) * 1000)
          .toLocaleString("es-CO", { timeZone: "America/Bogota" });

        let alertText =
          `🗑️ *Mensaje eliminado detectado*\n\n` +
          `${chatLabel}\n` +
          `👤 *Remitente:* +${senderNum}\n` +
          `📌 *Tipo:* ${tipo}\n` +
          `🕐 *Hora:* ${hora}\n` +
          `🆔 *ID:* ${key.id}`;

        if (caption) alertText += `\n📝 *Texto:* ${caption}`;

        await sock.sendMessage(botJid, { text: alertText });
        await sock.sendMessage(botJid, { forward: cached, force: true });

      } catch (err) {
        console.error("[antiDelete] Error:", err);
      }
    }
  });

  console.log("[antiDelete] ✅ Listener registrado");
}