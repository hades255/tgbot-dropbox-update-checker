# Dropbox Monitor with Telegram Notifications

This Node.js application monitors a Dropbox folder and sends notifications to Telegram when new files or folders are created.

## Setup

1. Create a Telegram bot:
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use the `/newbot` command to create a new bot
   - Save the bot token provided

2. Get your Telegram Chat ID:
   - Message [@userinfobot](https://t.me/userinfobot) on Telegram
   - It will reply with your Chat ID

3. Configure the environment:
   - Copy the `.env.example` file to `.env`
   - Fill in your Telegram bot token
   - Add your Telegram Chat ID
   - Set the path to your Dropbox folder

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the application:
   ```bash
   npm start
   ```

## Features

- Monitors specified Dropbox folder for new files and folders
- Sends instant notifications to Telegram
- Ignores hidden files
- Graceful shutdown with CTRL+C

## Environment Variables

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from BotFather
- `TELEGRAM_CHAT_ID`: Your Telegram chat ID
- `DROPBOX_PATH`: Full path to your Dropbox folder to monitor