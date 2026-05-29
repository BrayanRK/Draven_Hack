import fs from "fs";
import { exec } from "child_process";

export default {
  name: "update",
  aliases: ["actualizar"],

  async run(sock, msg, args, chatId) {

    try {

      if (!fs.existsSync(".git")) {
        return await sock.sendMessage(chatId, {
          text:
`❌ No se encontró la carpeta .git

Este bot fue instalado desde ZIP.

La actualización automática solo funciona si fue instalado usando:

git clone URL_DEL_REPOSITORIO`
        });
      }

      await sock.sendMessage(chatId, {
        text: "🔄 Buscando actualizaciones..."
      });

      exec(
        "git pull && npm install",
        async (error, stdout, stderr) => {

          if (error) {

            return await sock.sendMessage(chatId, {
              text:
`❌ Error durante la actualización

${error.message}`
            });
          }

          await sock.sendMessage(chatId, {
            text:
`✅ Actualización completada

${stdout.slice(0, 1500)}

♻️ Reiniciando...`
          });

          setTimeout(() => {
            process.exit(0);
          }, 3000);

        }
      );

    } catch (e) {

      await sock.sendMessage(chatId, {
        text: `❌ ${e.message}`
      });

    }
  }
};