const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const app = express();
const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.log("BOT_TOKEN is missing");
}

const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", (msg) => {
  bot.sendMessage(msg.chat.id, "✅ Bot is live on Render");
});

app.get("/", (req, res) => {
  res.send("SheinVoucherHub backend running successfully");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
