import fs from "fs";
import path from "path";
import os from "os";
import {
  downloadMediaMessage,
  normalizeMessageContent,
} from "@whiskeysockets/baileys";

const homeDir = os.homedir();

const isTermux =
  process.platform === "android" ||
  homeDir.includes("/data/data/com.termux/files/home");

const DOWNLOAD_DIR = isTermux
  ? path.join(homeDir, "storage", "shared", "DravenHack")
  : path.join(homeDir, "DravenHack");

const TEMP_DIR = isTermux
  ? path.join(homeDir, "storage", "shared", "DravenTemp")
  : path.join(homeDir, "DravenTemp");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ─── NUEVO: carpeta por contacto ──────────────────────────────────────────────
// Recibe el jid de quien mandó el mensaje y devuelve la ruta de su carpeta.
// Ejemplo: DravenHack/573001234567/
function getFolderForSender(senderJid) {
  const number = String(senderJid).split("@")[0].replace(/\D/g, "");
  const folderName = number || "desconocido";
  const folderPath = path.join(DOWNLOAD_DIR, folderName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
}
// ──────────────────────────────────────────────────────────────────────────────

function getQuotedInfo(msg) {
  const ctx = msg?.message?.extendedTextMessage?.contextInfo;
  if (!ctx?.quotedMessage || !ctx?.stanzaId) return null;

  const remoteJid = msg.key.remoteJid;
  const isGroup = remoteJid?.endsWith("@g.us");

  const key = {
    remoteJid,
    fromMe: false,
    id: ctx.stanzaId,
  };

  if (isGroup && ctx.participant) {
    key.participant = ctx.participant;
  }

  return {
    quotedMessage: ctx.quotedMessage,
    key,
  };
}

function findMedia(message) {
  if (!message) return null;

  if (message.imageMessage) return { type: "image", message };
  if (message.videoMessage) return { type: "video", message };
  if (message.audioMessage) return { type: "audio", message };

  if (message.viewOnceMessage?.message) return findMedia(message.viewOnceMessage.message);
  if (message.viewOnceMessageV2?.message) return findMedia(message.viewOnceMessageV2.message);
  if (message.viewOnceMessageV2Extension?.message) return findMedia(message.viewOnceMessageV2Extension.message);
  if (message.ephemeralMessage?.message) return findMedia(message.ephemeralMessage.message);

  return null;
}

function deleteFileSafe(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}
}

// ─── Exportamos también la lógica de descarga para usarla desde index.js ──────
// downloadAndSave(sock, fakeMsg, media, senderJid)
// Devuelve true si guardó bien, false si falló. Sin mensajes al chat.
export async function downloadAndSave(sock, fakeMsg, media, senderJid) {
  let tempFile = null;
  try {
    const buffer = await downloadMediaMessage(
      fakeMsg,
      "buffer",
      {},
      {
        logger: undefined,
        reuploadRequest: sock.updateMediaMessage,
      }
    );

    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 1000) {
      return false;
    }

    // ── Carpeta del contacto que mandó el viewOnce ──
    const saveDir = getFolderForSender(senderJid);

    if (media.type === "image") {
      const filePath = path.join(saveDir, `imagen_${Date.now()}.jpg`);
      fs.writeFileSync(filePath, buffer);
      console.log(`📸 [vv] Imagen guardada en: ${filePath}`);
      return true;
    }

    if (media.type === "audio") {
      tempFile = path.join(TEMP_DIR, `audio_tmp_${Date.now()}.ogg`);
      fs.writeFileSync(tempFile, buffer);
      const finalPath = path.join(saveDir, `audio_${Date.now()}.ogg`);
      fs.copyFileSync(tempFile, finalPath);
      console.log(`🎵 [vv] Audio guardado en: ${finalPath}`);
      return true;
    }

    // video
    tempFile = path.join(TEMP_DIR, `video_tmp_${Date.now()}.mp4`);
    fs.writeFileSync(tempFile, buffer);
    const finalPath = path.join(saveDir, `video_${Date.now()}.mp4`);
    fs.copyFileSync(tempFile, finalPath);
    console.log(`🎥 [vv] Video guardado en: ${finalPath}`);
    return true;

  } catch (e) {
    console.log("❌ [vv] Error al guardar:", e.message);
    return false;
  } finally {
    deleteFileSafe(tempFile);
  }
}
// ──────────────────────────────────────────────────────────────────────────────

export default {
  name: "vv",
  aliases: ["jajaja", "bella", "hermosa", "<3", "💖", "💘", "💝", "teamo", "f", "wow", "o", ":3", "xvidrios", "sexo", "3"],
  async run(sock, msg, args, chatId) {
    const quotedInfo = getQuotedInfo(msg);
    if (!quotedInfo) return;

    const normalized = normalizeMessageContent(quotedInfo.quotedMessage);
    const media = findMedia(normalized);
    if (!media) return;

    // ── El sender real es quien mandó el viewOnce (el que citaste) ──
    // En grupos viene en ctx.participant, en privado en remoteJid
    const ctx = msg?.message?.extendedTextMessage?.contextInfo;
    const senderJid =
      ctx?.participant ||        // grupo: quien mandó el viewOnce original
      msg.key.remoteJid;         // privado: el chat es el sender

    const fakeMsg = {
      key: quotedInfo.key,
      message: normalized,
    };

    await downloadAndSave(sock, fakeMsg, media, senderJid);
    // Sin mensajes al chat. Silencioso total.
  },
};