import {bot} from "./services/telegram/bot";
import {logger} from "./logger/logger";
import {botConfig} from "./config/config";
import {streamCheckJob} from "./cron/scheduler";

bot.launch();
logger.info(`Bot launched successfully for streamer: ${botConfig.STREAMER_USERNAME}, channel: ${botConfig.TELEGRAM_CHANNEL_ID}`);

streamCheckJob.start();
logger.info("Stream checking cron job started.");
    
process.once('SIGINT', () => {
    logger.warn("SIGINT received. Stopping bot...");
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    logger.warn("SIGTERM received. Stopping bot...");
    bot.stop('SIGTERM');
});
