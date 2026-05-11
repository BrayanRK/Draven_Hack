// commands/utils/antidelete.js
import { toggleAntiDelete, isAntiDeleteActive } from "../../plugins/antiDelete.js";

export default {
  name: "antidelete",
  aliases: ["ad"],
  cooldown: 3000,

  async run(sock, msg, args) {
    const chatJid = msg.key.remoteJid;
    const sub = args[0]?.toLowerCase();

    if (!sub || !["on", "off"].includes(sub)) {
      const estado = isAntiDeleteActive() ? "✅ *activado*" : "❌ *desactivado*";
      return await sock.sendMessage(chatJid, {
        text: `🗑️ *AntiDelete* está ${estado}\n\nUso: \`.antidelete on\` / \`.antidelete off\``,
      }, { quoted: msg });
    }

    const activar = sub === "on";
    toggleAntiDelete(activar);

    await sock.sendMessage(chatJid, {
      text: activar
        ? "✅ *AntiDelete activado*\nTe avisaré cuando alguien elimine un mensaje."
        : "❌ *AntiDelete desactivado*\nYa no se detectarán mensajes eliminados.",
    }, { quoted: msg });
  },
};