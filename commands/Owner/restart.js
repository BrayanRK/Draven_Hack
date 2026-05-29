export default {
  name: "restart",

  async run(sock, msg, args, chatId) {

    await sock.sendMessage(chatId, {
      text: "♻️ Reiniciando..."
    });

    process.exit(0);
  }
};