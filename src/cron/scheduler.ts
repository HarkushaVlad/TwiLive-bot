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
            const streamData = await getStreamData(botConfig.STREAMER_USERNAME);
            const currentPostId = await getCurrentPostId(botConfig.STREAMER_USERNAME);

            if (streamData && !currentPostId) {
                logger.info(`${botConfig.STREAMER_USERNAME} started stream`)

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
                logger.info("Cron checking job stopped");

                streamUpdateJob.start();
                logger.info("Cron updating job started");

                return;
            }
        } catch (error) {
            logger.error(`Stream check error: ${error}`);
        }
    },
    null,
    false,
    'Europe/Kyiv'
);

const streamUpdateJob = new CronJob(
    '0 */3 * * * *',
    async () => {
        const currentPostId = await getCurrentPostId(botConfig.STREAMER_USERNAME);

        if (!currentPostId) return;

        const streamData = await getStreamData(botConfig.STREAMER_USERNAME);

        if (!streamData && currentPostId) {
            logger.info(`${botConfig.STREAMER_USERNAME} finished stream`)

            await deleteStreamPost(
                botConfig.TELEGRAM_CHANNEL_ID!,
                currentPostId
            );

            await deleteCurrentPostId(botConfig.STREAMER_USERNAME);


            streamUpdateJob.stop();
            logger.info("Cron updating job stopped");

            streamCheckJob.start();
            logger.info("Cron checking job started");

            return;
        }

        try {
            await updateStreamPost(
                botConfig.TELEGRAM_CHANNEL_ID!,
                currentPostId,
                botConfig.STREAMER_USERNAME
            );
        } catch (error) {
            logger.error(`Post update error: ${error}`);
        }
    },
    null,
    false,
    'Europe/Kyiv'
);