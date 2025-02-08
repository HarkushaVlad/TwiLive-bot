import {CronJob} from 'cron';
import {botConfig} from "../config/config";
import {deleteStreamPost, sendStreamPost, updateStreamPost} from "../services/telegram/messaging";
import {getStreamData} from "../services/twitch/stream";
import {logger} from "../logger/logger";
import {deleteCurrentPostId, getCurrentPostId, saveCurrentPostId} from "../repositories/currentPostRepository";

export const streamCheckJob = new CronJob(
    '0 * * * * *',
    async () => {
        try {
            logger.info("Checking stream status...");

            const streamData = await getStreamData(botConfig.STREAMER_USERNAME);
            const currentPostId = await getCurrentPostId(botConfig.STREAMER_USERNAME);

            if (streamData && !currentPostId) {
                logger.info(`Stream started for user: ${botConfig.STREAMER_USERNAME}`);

                const newPostId = await sendStreamPost(
                    botConfig.TELEGRAM_CHANNEL_ID!,
                    botConfig.STREAMER_USERNAME
                );

                await saveCurrentPostId(
                    botConfig.STREAMER_USERNAME,
                    botConfig.TELEGRAM_CHANNEL_ID!,
                    newPostId
                );

                streamCheckJob.stop();
                logger.info("Stream checking job stopped.");

                streamUpdateJob.start();
                logger.info("Stream update job started.");
            }
        } catch (error) {
            logger.error(`Error during stream check: ${error}`);
        }
    },
    null,
    false,
    'Europe/Kyiv'
);

const streamUpdateJob = new CronJob(
    '0 */3 * * * *',
    async () => {
        try {
            logger.info("Updating stream post...");

            const currentPostId = await getCurrentPostId(botConfig.STREAMER_USERNAME);

            if (!currentPostId) {
                logger.warn(`No active stream post found for user: ${botConfig.STREAMER_USERNAME}`);
                return;
            }

            const streamData = await getStreamData(botConfig.STREAMER_USERNAME);

            if (!streamData) {
                logger.info(`Stream ended for user: ${botConfig.STREAMER_USERNAME}`);

                await deleteStreamPost(
                    botConfig.TELEGRAM_CHANNEL_ID!,
                    currentPostId
                );

                await deleteCurrentPostId(botConfig.STREAMER_USERNAME);

                streamUpdateJob.stop();
                logger.info("Stream update job stopped.");

                streamCheckJob.start();
                logger.info("Stream checking job restarted.");

                return;
            }

            await updateStreamPost(
                botConfig.TELEGRAM_CHANNEL_ID!,
                currentPostId,
                botConfig.STREAMER_USERNAME
            );

        } catch (error) {
            logger.error(`Error updating stream post: ${error}`);
        }
    },
    null,
    false,
    'Europe/Kyiv'
);
