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

// Initialize Telegram bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

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
      console.log(match)
      if (number) {
        date = new Date(Math.abs(number)).toLocaleString();
      }
    }
    const dirname = pathname.substring(DROPBOX_PATH.length + 1);
    const message = `📄 New file detected: ${date}\n${dirname}\n${filename}`;

    try {
      await bot.sendMessage(TELEGRAM_CHAT_ID, message);
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
    await bot.sendMessage(TELEGRAM_CHAT_ID, message);
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