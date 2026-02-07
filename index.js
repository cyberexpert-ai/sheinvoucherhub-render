const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

// ===== CONFIG =====
const TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const APP_URL = "https://sheinvoucherhub-render.onrender.com";
const ADMIN_ID = 8004114088;

// ===== GOOGLE SHEETS =====
const SHEET_ID = "1S255Xdh_ukCXgyc-DwqxknBhV1pcqgNyehajdB-dfhA";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// ===== BOT (WEBHOOK) =====
const bot = new TelegramBot(TOKEN);
const WEBHOOK_PATH = `/bot${TOKEN}`;
bot.setWebHook(`${APP_URL}${WEBHOOK_PATH}`);

app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ===== START =====
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;

  bot.sendMessage(
    chatId,
    `👋 Welcome ${name}\n\nPlease join our channel and verify.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📢 Join Channel", url: "https://t.me/SheinVoucherHub" }],
          [{ text: "✅ Verify", callback_data: "verify_join" }],
        ],
      },
    }
  );
});

// ===== VERIFY JOIN =====
bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;

  if (q.data === "verify_join") {
    const member = await bot.getChatMember("@SheinVoucherHub", chatId);
    if (member.status === "left") {
      bot.sendMessage(chatId, "❌ Please join the channel first.");
      return;
    }

    // captcha
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;

    bot.sendMessage(chatId, `🤖 Verification\n\nWhat is ${a} + ${b}?`);
    bot.once("message", async (ans) => {
      if (parseInt(ans.text) !== a + b) {
        bot.sendMessage(chatId, "❌ Wrong answer. Send /start again.");
        return;
      }

      // save user
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "Users!A:D",
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              chatId,
              ans.from.first_name,
              new Date().toISOString(),
              "Active",
            ],
          ],
        },
      });

      bot.sendMessage(chatId, "✅ Verified successfully!");
      showMainMenu(chatId);
    });
  }
});

// ===== MAIN MENU =====
function showMainMenu(chatId) {
  bot.sendMessage(chatId, "🏠 Main Menu", {
    reply_markup: {
      keyboard: [
        ["🛍️ Buy Vouchers"],
        ["📦 My Orders"],
        ["🔄 Recover Vouchers"],
        ["🆘 Support"],
      ],
      resize_keyboard: true,
    },
  });
}

// ===== HEALTH =====
app.get("/", (req, res) => {
  res.send("SheinVoucherHub Bot Running");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
