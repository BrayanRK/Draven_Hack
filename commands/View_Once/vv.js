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

export default {
  name: "vv",
  aliases: ["jajaja", "bella", "hermosa", "<3", "💖", "💘", "💝", "teamo", "f", "wow", "o", ":3"],
  async run(sock, msg, args, chatId) {
   
    const quotedInfo = getQuotedInfo(msg);
    if (!quotedInfo) return;

    const normalized = normalizeMessageContent(quotedInfo.quotedMessage);
    const media = findMedia(normalized);
    if (!media) return;

    let tempFile = null;

    try {
      const fakeMsg = {
        key: quotedInfo.key,
        message: normalized,
      };

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
        throw new Error("No pude descargar el archivo multimedia.");
      }

      if (media.type === "image") {
        const fileName = `imagen_draven_${Date.now()}.jpg`;
        const filePath = path.join(DOWNLOAD_DIR, fileName);
        fs.writeFileSync(filePath, buffer);
        return;
      }

      if (media.type === "audio") {
        tempFile = path.join(TEMP_DIR, `audio_draven_${Date.now()}.ogg`);
        fs.writeFileSync(tempFile, buffer);

        const finalName = `audio_draven_${Date.now()}.ogg`;
        const finalPath = path.join(DOWNLOAD_DIR, finalName);
        fs.copyFileSync(tempFile, finalPath);
        return;
      }

      tempFile = path.join(TEMP_DIR, `video_draven_${Date.now()}.mp4`);
      fs.writeFileSync(tempFile, buffer);

      const finalName = `video_draven_${Date.now()}.mp4`;
      const finalPath = path.join(DOWNLOAD_DIR, finalName);
      fs.copyFileSync(tempFile, finalPath);
    } catch {}
    finally {
      deleteFileSafe(tempFile);
    }
  },
};
