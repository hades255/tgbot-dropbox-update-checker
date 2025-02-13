import chokidar from 'chokidar';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  DROPBOX_PATH
} = process.env;

// Validate environment variables
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || !DROPBOX_PATH) {
  console.error('Please set all required environment variables in .env file');
  process.exit(1);
}

const CHAT_ID = Number(TELEGRAM_CHAT_ID)
let observers = [CHAT_ID]
let allow = false

// Initialize Telegram bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/echo/, (msg,) => {
  const chatId = msg.chat.id;
  console.log("echo", chatId)
  bot.sendMessage(chatId, `Your member ID: ${chatId}`);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log("start", chatId)
  if (chatId == CHAT_ID || allow) {
    if (!observers.includes(chatId)) observers.push(chatId)
    bot.sendMessage(chatId, "Bot is started! `/help` to see commands");
  } else {
    bot.sendMessage(chatId, "You are not allowed to run the bot");
  }
});

bot.onText(/\/stop/, (msg,) => {
  const chatId = msg.chat.id;
  console.log("stop", chatId)
  observers = observers.filter(item => item != chatId)
  bot.sendMessage(chatId, "Bot is stopped");
});

bot.onText(/\/observers/, (msg,) => {
  const chatId = msg.chat.id;
  console.log("observers", chatId)
  bot.sendMessage(chatId, `${observers.join(",\n")}\n${allow ? "Allowed" : "Rejected"} others to use this bot`);
});

bot.onText(/\/allow/, (msg,) => {
  const chatId = msg.chat.id;
  console.log("allow", chatId)
  if (chatId == CHAT_ID) {
    allow = true
    bot.sendMessage(chatId, "reset successfully");
  } else {
    bot.sendMessage(chatId, "401 ERROR");
  }
});

bot.onText(/\/reject/, (msg,) => {
  const chatId = msg.chat.id;
  console.log("reject", chatId)
  if (chatId == CHAT_ID) {
    allow = false
    bot.sendMessage(chatId, "reset successfully");
  } else {
    bot.sendMessage(chatId, "401 ERROR");
  }
});

bot.onText(/\/help/, (msg,) => {
  const chatId = msg.chat.id;
  console.log("help", chatId)
  bot.sendMessage(chatId, "`/start`: run the bot\n`/stop`: stop the bot\n`/observers`: show running users\n`/echo`: show your member id\n`/reset`: reset users\m`/allow`: allow others to tun the bot\n`/reject`: reject others to use the bot\n\n`/help`: see help");
});

bot.onText(/\/reset (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  console.log("reset", chatId)
  if (chatId == CHAT_ID) {
    observers = [CHAT_ID]
    bot.sendMessage(chatId, "reset successfully");
  } else {
    bot.sendMessage(chatId, "401 ERROR");
  }
  // const resp = match[1]; // the captured "whatever"
  // observers = [CHAT_ID]
  // bot.sendMessage(chatId, resp);
});

// Initialize watcher
const watcher = chokidar.watch(DROPBOX_PATH, {
  persistent: true,
  ignoreInitial: true,
  ignored: /(^|[\/\\])\../ // Ignore hidden files
});

console.log(`🔍 Monitoring Dropbox folder: ${DROPBOX_PATH}`);

// Handle new files and directories
watcher.on('add', async (filepath) => {
  const filename = path.basename(filepath);
  const pathname = path.dirname(filepath);
  if (pathname.includes(DROPBOX_PATH)) {
    const match = filename.match(/-(\d+)/);
    let date = "";
    if (match) {
      const number = match[1];
      if (number) {
        date = new Date(Math.abs(number)).toLocaleString();
      }
    }
    const dirname = pathname.substring(DROPBOX_PATH.length + 1);
    const message = `📄 New file detected: ${date}\nFolder: ${dirname}\n${filename}`;

    try {
      for (let item of observers) {
        await bot.sendMessage(item, message);
      }
      console.log(`Notification sent for new file: ${filename}`);
    } catch (error) {
      console.error('Error sending Telegram notification:', error.message);
    }
  }
});

watcher.on('addDir', async (filepath) => {
  const dirname = path.basename(filepath);
  const message = `📁 New folder detected:\n${dirname}`;

  try {
    for (let item of observers) {
      await bot.sendMessage(item, message);
    }
    console.log(`Notification sent for new directory: ${dirname}`);
  } catch (error) {
    console.error('Error sending Telegram notification:', error.message);
  }
});

// Handle errors
watcher.on('error', (error) => {
  console.error('Watcher error:', error);
});

process.on('SIGINT', () => {
  console.log('\n👋 Stopping Dropbox monitor...');
  watcher.close();
  process.exit(0);
});