import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// ══ ÍCONOS POR CATEGORÍA ══════════════════════════════════════════════════════
const CATEGORY_ICONS = {
  GENERAL:  "⚡",
  MEDIA:    "🎬",
  TOOLS:    "⚙️",
  FUN:      "🎮",
  OWNER:    "💀",
  ADMIN:    "🔱",
  INFO:     "📡",
  NSFW:     "🔞",
  DEFAULT:  "🗡️",
};

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat] || CATEGORY_ICONS.DEFAULT;
}

export default {
  name: "menu",
  aliases: ["help", "comandos", "cmd", "OWNER"],
  async run(sock, msg) {
    const jid = msg.key.remoteJid;
    const prefix = ".";
    const commandsDir = path.join(process.cwd(), 'commands');

    const getFiles = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of list) {
        const res = path.resolve(dir, item.name);
        if (item.isDirectory()) {
          results = [...results, ...getFiles(res)];
        } else if (item.name.endsWith('.js')) {
          results.push(res);
        }
      }
      return results;
    };

    try {
      const allFiles = getFiles(commandsDir);
      let menuData = {};

      for (const filePath of allFiles) {
        if (filePath.endsWith('menu.js')) continue;

        try {
          const { default: cmd } = await import(`${pathToFileURL(filePath).href}?update=${Date.now()}`);
          if (cmd && cmd.name) {
            const raw = path.basename(path.dirname(filePath)).toUpperCase();
            const category = raw === 'COMMANDS' ? 'GENERAL' : raw;
            if (!menuData[category]) menuData[category] = [];
            menuData[category].push({
              name: cmd.name,
              aliases: cmd.aliases || [],
            });
          }
        } catch (e) {
          console.error(`Error en menú al leer ${filePath}:`, e.message);
        }
      }

      const categories = Object.keys(menuData).sort();
      const totalCmds = categories.reduce((acc, c) => acc + menuData[c].length, 0);

      let t = "";

      // ══ HEADER ══════════════════════════════════════════
      t += `╔▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╗\n`;
      t += `▓░                        ░▓\n`;
      t += `▓░   💀 *D R A V E N*     ░▓\n`;
      t += `▓░      *H A C K*         ░▓\n`;
      t += `▓░                        ░▓\n`;
      t += `╚▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╝\n`;
      t += `\n`;
      t += `▸▸ 📦 *${totalCmds} comandos* cargados\n`;
      t += `▸▸ 🔑 Prefijo ➜ \`${prefix}\`\n`;
      t += `\n`;
      t += `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n`;
      t += `\n`;

      // ══ CATEGORÍAS ══════════════════════════════════════
      for (const category of categories) {
        const icon = getCategoryIcon(category);
        const cmds = menuData[category];

        t += `『 ${icon} *${category}* 』\n`;

        for (const c of cmds) {
          t += `┃ ⚔ \`${prefix}${c.name}\`\n`;

          // Todos los aliases, en grupos de 3 por línea
          if (c.aliases.length > 0) {
            for (let i = 0; i < c.aliases.length; i += 3) {
              const chunk = c.aliases.slice(i, i + 3);
              t += `┃   ↳ _${chunk.map(a => `${prefix}${a}`).join("  ·  ")}_\n`;
            }
          }
        }

        t += `┃\n`;
        t += `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n`;
        t += `\n`;
      }

      // ══ FOOTER ══════════════════════════════════════════
      t += `> ⚡ _${prefix}help <cmd> para más info_\n`;
      t += `> 💀 _Solo el owner puede usar esto_`;

      await sock.sendMessage(jid, { text: t.trim() }, { quoted: msg });

    } catch (error) {
      console.error("Error crítico en menú:", error);
    }
  },
};