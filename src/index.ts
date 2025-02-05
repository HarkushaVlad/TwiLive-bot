import {bot} from "./services/telegram/bot";
import {logger} from "./logger/logger";
import {botConfig} from "./config/config";
import {streamCheckJob} from "./cron/scheduler";
import {deleteAllPosts} from "./services/telegram/messaging";

bot.launch();
logger.info(`Bot launched successfully for streamer: ${botConfig.STREAMER_USERNAME}, channel: ${botConfig.TELEGRAM_CHANNEL_ID}`);

deleteAllPosts().then(() => {
    streamCheckJob.start();
    logger.info("Stream checking cron job started.");
}).catch((error) => {
    logger.error(`Failed to delete all posts before starting cron job: ${error}`);
});

process.once('SIGINT', () => {
    logger.warn("SIGINT received. Stopping bot...");
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    logger.warn("SIGTERM received. Stopping bot...");
    bot.stop('SIGTERM');
});
