export default {
  name: "menu",
  aliases: ["help", "comandos", "cmd"],
  async run(sock, msg) {
    const texto = `
╭─〔 *DRAVEN_HACK* 〕─╮
│
│ 📂 *Comando principal:*
│ .vv
│
│ 🔁 *Aliases de vv:*
│ .jajaja
│ .bella
│ .hermosa
│ .<3
│ .💖
│ .💘
│ .💝
│ .teamo
│ .f
│ .wow
│ .o
│
│ 📌 *Uso:*
│ Responde a un view once con
│ cualquiera de esos comandos
│
╰────────────────╯
`.trim();

    await sock.sendMessage(msg.key.remoteJid, { text: texto }, { quoted: msg });
  },
};