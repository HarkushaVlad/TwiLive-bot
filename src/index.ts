import {bot} from "./services/telegram/bot";
import {logger} from "./logger/logger";
import {botConfig} from "./config/config";
import {streamCheckJob} from "./cron/scheduler";
import {deleteAllPosts} from "./services/telegram/messaging";

bot.launch();
logger.info(`🤖 Bot is launched for ${botConfig.STREAMER_USERNAME} | ${botConfig.TELEGRAM_CHANNEL_ID}`);

deleteAllPosts().then(() => {
    streamCheckJob.start()
    logger.info("Cron checking job started");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));