import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export default {
  name: "menu",
  aliases: ["help", "comandos", "cmd"],
  async run(sock, msg) {
    const jid = msg.key.remoteJid;
    const prefix = ".";
    const commandsDir = path.join(process.cwd(), 'commands');

    // 1. Función para leer TODO incluyendo subcarpetas
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
          // Importación dinámica
          const { default: cmd } = await import(`${pathToFileURL(filePath).href}?update=${Date.now()}`);

          if (cmd && cmd.name) {
            // La categoría es el nombre de la carpeta donde está el archivo
            const category = path.basename(path.dirname(filePath)).toUpperCase();
            
            if (!menuData[category]) menuData[category] = [];
            menuData[category].push({
              name: cmd.name,
              aliases: cmd.aliases || []
            });
          }
        } catch (e) {
          console.error(`Error en menú al leer ${filePath}:`, e.message);
        }
      }

      // 2. Construir el texto melo
      let texto = `╭─〔 *DRAVEN_HACK* 〕─╮\n│\n`;

      // Ordenar categorías para que no salgan al azar
      const categories = Object.keys(menuData).sort();

      for (const category of categories) {
        texto += `│ 📂 *${category === 'COMMANDS' ? 'GENERAL' : category}*\n`;
        
        menuData[category].forEach(c => {
          const aliasText = c.aliases.length > 0 
            ? ` _(${c.aliases.join(", ")})_` 
            : "";
          texto += `│ ${prefix}${c.name}${aliasText}\n`;
        });
        texto += `│\n`;
      }

      texto += `╰────────────────╯`;

      await sock.sendMessage(jid, { text: texto.trim() }, { quoted: msg });

    } catch (error) {
      console.error("Error crítico en menú:", error);
    }
  },
};
