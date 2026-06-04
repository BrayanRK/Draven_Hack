// commands/utils/automensaje.js
const timers = new Map();

export default {
  name: "automensaje",
  aliases: ["au"],

  async run(sock, msg, args) {
    const chatJid = msg.key.remoteJid;
    const sub = args[0]?.toLowerCase();

    // .au #rw <mensaje>
    if (sub === "#rw") {
      const texto = args.slice(1).join(" ");

      if (!texto) {
        return await sock.sendMessage(chatJid, {
          text: "⚠️ Escribe el mensaje a enviar.\nEjemplo: `.au #rw Hola a todos!`",
        }, { quoted: msg });
      }

      // Si ya hay un timer activo en este chat, lo cancela primero
      if (timers.has(chatJid)) {
        clearInterval(timers.get(chatJid));
      }

      // Envia el primer mensaje inmediatamente
      await sock.sendMessage(chatJid, { text: texto });

      // Luego cada 5 minutos y 5 segundos
      const intervalo = setInterval(async () => {
        try {
          await sock.sendMessage(chatJid, { text: texto });
        } catch (e) {
          console.error("[automensaje] Error enviando:", e);
          clearInterval(intervalo);
          timers.delete(chatJid);
        }
      }, 5 * 60 * 1000 + 5 * 1000); // 305,000 ms

      timers.set(chatJid, intervalo);

      return await sock.sendMessage(chatJid, {
        text: `✅ *Auto-mensaje activado*\nMensaje: _${texto}_\nIntervalo: cada 5 min 5 seg`,
      }, { quoted: msg });
    }

    // .au #w — detener
    if (sub === "#w") {
      if (!timers.has(chatJid)) {
        return await sock.sendMessage(chatJid, {
          text: "⚠️ No hay ningún auto-mensaje activo en este chat.",
        }, { quoted: msg });
      }

      clearInterval(timers.get(chatJid));
      timers.delete(chatJid);

      return await sock.sendMessage(chatJid, {
        text: "🛑 *Auto-mensaje detenido.*",
      }, { quoted: msg });
    }

    // Sin subcomando válido
    await sock.sendMessage(chatJid, {
      text: `📋 *Auto-mensaje*\n\n▶️ Activar: \`.au #rw <mensaje>\`\n⏹️ Detener: \`.au #w\``,
    }, { quoted: msg });
  },
};