import {bot} from "./services/telegram/bot";
import {consoleLogger} from "./core/logger";
import {botConfig} from "./config/config";
import {streamCheckJob} from "./core/scheduler";

bot.launch();
consoleLogger.info(`🤖 Bot is launched for ${botConfig.STREAMER_USERNAME} | ${botConfig.TELEGRAM_CHANNEL_ID}`);

streamCheckJob.start();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));