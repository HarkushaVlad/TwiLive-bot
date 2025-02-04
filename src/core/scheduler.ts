import {CronJob} from 'cron';
import {botConfig} from "../config/config";
import {deleteStreamPost, sendStreamPost, updateStreamPost} from "../services/telegram/messaging";
import {getStreamData} from "../services/twitch/stream";
import {consoleLogger} from "./logger";

let currentPostId: number | null = null;

export const streamCheckJob = new CronJob(
    '0 * * * * *',
    async () => {
        try {
            const streamData = await getStreamData(botConfig.STREAMER_USERNAME);

            if (streamData && !currentPostId) {
                currentPostId = await sendStreamPost(
                    botConfig.TELEGRAM_CHANNEL_ID!,
                    botConfig.STREAMER_USERNAME
                );

                streamUpdateJob.start();
                streamCheckJob.stop();
                return;
            }
        } catch (error) {
            consoleLogger.error(`Stream check error: ${error}`);
        }
    },
    null,
    false,
    'Europe/Kyiv'
);

const streamUpdateJob = new CronJob(
    '0 */3 * * * *',
    async () => {
        if (!currentPostId) return;

        const streamData = await getStreamData(botConfig.STREAMER_USERNAME);

        if (!streamData && currentPostId) {
            await deleteStreamPost(
                botConfig.TELEGRAM_CHANNEL_ID!,
                currentPostId
            );

            currentPostId = null;
            streamCheckJob.start();
            streamUpdateJob.stop();
            return;
        }

        try {
            await updateStreamPost(
                botConfig.TELEGRAM_CHANNEL_ID!,
                currentPostId,
                botConfig.STREAMER_USERNAME
            );
        } catch (error) {
            consoleLogger.error(`Post update error: ${error}`);
        }
    },
    null,
    false,
    'Europe/Kyiv'
);