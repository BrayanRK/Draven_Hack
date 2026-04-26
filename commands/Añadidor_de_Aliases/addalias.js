import fs from 'fs';
import path from 'path';

export default {
  name: "addalias",
  aliases: ["alias"],
  async run(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (args.length < 2) {
      return sock.sendMessage(jid, { text: "❌ *Uso:* .addalias [comando] [nuevo_alias]" });
    }

    const commandName = args[0].toLowerCase();
    const aliasToAdd = args.slice(1).join(" ").split(",").map(a => a.trim());
    const commandsDir = path.join(process.cwd(), 'commands');

    // Función para buscar el archivo en subcarpetas
    const findFile = (dir, fileName) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const res = path.resolve(dir, item.name);
        if (item.isDirectory()) {
          const found = findFile(res, fileName);
          if (found) return found;
        } else if (item.name === `${fileName}.js`) {
          return res;
        }
      }
      return null;
    };

    const filePath = findFile(commandsDir, commandName);

    if (!filePath) {
      return sock.sendMessage(jid, { text: `❌ El comando *${commandName}* no se encontró en ninguna carpeta.` });
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const aliasRegex = /aliases:\s*\[\s*([^\]]*)\s*\]/;
      const match = content.match(aliasRegex);
      
      let currentAliases = [];
      if (match && match[1]) {
        currentAliases = match[1].split(',').map(a => a.replace(/["']/g, "").trim()).filter(a => a !== "");
      }

      const updatedAliases = [...new Set([...currentAliases, ...aliasToAdd])];
      const newAliasString = `aliases: ["${updatedAliases.join('", "')}"]`;

      if (match) {
        content = content.replace(aliasRegex, newAliasString);
      } else {
        content = content.replace(/name:\s*["'][^"']+["']/, (m) => `${m},\n  ${newAliasString}`);
      }

      fs.writeFileSync(filePath, content, 'utf8');

      await sock.sendMessage(jid, { 
        text: `✅ *Actualizado en:* _${path.relative(commandsDir, filePath)}_\n\n*Comando:* ${commandName}\n*Lista:* ${updatedAliases.join(", ")}` 
      }, { quoted: msg });

    } catch (error) {
      await sock.sendMessage(jid, { text: "❌ Error al editar: " + error.message });
    }
  },
};
