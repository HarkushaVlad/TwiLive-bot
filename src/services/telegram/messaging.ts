import {getStreamData} from "../twitch/stream";
import {captureStreamSegmentUsingStreamlink} from "../ffmpeg/capturing";
import {logger} from "../../logger/logger";
import {bot} from "./bot";
import {truncateCurrentPosts} from "../../repositories/currentPostRepository";
import {prisma} from "../../prisma/client";

function formatStreamDuration(startedAt: Date): string {
    const durationMs = Date.now() - startedAt.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}

function getMessage(streamData: any, streamerUsername: string): string {
    return `
<a href="https://www.twitch.tv/${streamerUsername}">🚨 СТРІМ ВЖЕ ЙДЕ! 🚨</a>

🎦 <b>Зараз:</b> ${streamData.category}

<b>${streamData.title}</b>

🕒 <b>Стрім триває:</b> ${formatStreamDuration(streamData.startedAt)}
👀 <b>Глядачів:</b> ${streamData.viewerCount}

<a href="https://www.twitch.tv/${streamerUsername}">..Заходь, не вистачає саме тебе💙</a>
    `;
}

export async function sendStreamPost(channelId: string, streamerUsername: string): Promise<number> {
    try {
        logger.info(`Fetching stream data for ${streamerUsername}...`);
        const streamData = await getStreamData(streamerUsername);

        if (!streamData) {
            logger.warn(`No stream data available for ${streamerUsername}. Skipping post creation.`);
            return -1;
        }

        logger.info(`Capturing stream segment for ${streamerUsername}...`);
        const gifPath = await captureStreamSegmentUsingStreamlink(streamerUsername);

        logger.info(`Sending stream post to channel ${channelId}...`);
        const message = await bot.telegram.sendAnimation(
            channelId,
            {source: gifPath},
            {
                caption: getMessage(streamData, streamerUsername),
                parse_mode: 'HTML'
            }
        );

        logger.info(`Stream post sent successfully. Message ID: ${message.message_id}`);
        return message.message_id;
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`Failed to send stream post for ${streamerUsername}: ${error.message}`);
        } else {
            logger.error(`Failed to send stream post for ${streamerUsername}: Unknown error`);
        }
        throw error;
    }
}

export async function updateStreamPost(chatId: string, messageId: number, streamerUsername: string): Promise<boolean> {
    try {
        logger.info(`Fetching updated stream data for ${streamerUsername}...`);
        const streamData = await getStreamData(streamerUsername);

        if (!streamData) {
            logger.warn(`Stream for ${streamerUsername} is no longer live.`);
            return false;
        }

        let gifPath: string;
        try {
            logger.info(`Capturing new stream segment for ${streamerUsername}...`);
            gifPath = await captureStreamSegmentUsingStreamlink(streamerUsername);
        } catch (captureError) {
            logger.error(`Failed to capture stream for ${streamerUsername}: ${captureError}`);
            return await updatePostTextOnly(chatId, messageId, streamData, streamerUsername);
        }

        try {
            logger.info(`Updating stream post (ID: ${messageId}) in chat ${chatId}...`);
            await bot.telegram.editMessageMedia(chatId, messageId, undefined, {
                type: 'animation',
                media: {source: gifPath},
                caption: getMessage(streamData, streamerUsername),
                parse_mode: 'HTML'
            });

            logger.info(`Stream post (ID: ${messageId}) updated successfully.`);
            return true;
        } catch (telegramError) {
            logger.error(`Failed to update Telegram message: ${telegramError}`);
            return false;
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`Failed to update stream post for ${streamerUsername}: ${error.message}`);
        } else {
            logger.error(`Failed to update stream post for ${streamerUsername}: Unknown error`);
        }
        return false;
    }
}

async function updatePostTextOnly(chatId: string, messageId: number, streamData: any, streamerUsername: string): Promise<boolean> {
    try {
        await bot.telegram.editMessageCaption(
            chatId,
            messageId,
            undefined,
            getMessage(streamData, streamerUsername),
            {parse_mode: 'HTML'}
        );
        logger.info(`Updated post text only for ${streamerUsername} (fallback method)`);
        return true;
    } catch (error) {
        logger.error(`Failed to update post text: ${error}`);
        return false;
    }
}

export async function deleteStreamPost(chatId: string, messageId: number) {
    try {
        logger.info(`Deleting stream post (ID: ${messageId}) from chat ${chatId}...`);
        await bot.telegram.deleteMessage(chatId, messageId);
        logger.info(`Stream post (ID: ${messageId}) deleted successfully.`);
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`Failed to delete stream post (ID: ${messageId}): ${error.message}`);
        } else {
            logger.error(`Failed to delete stream post (ID: ${messageId}): Unknown error`);
        }
    }
}

export async function deleteAllPosts() {
    try {
        logger.info("Fetching all posts for deletion...");
        const posts = await prisma.currentPost.findMany();

        if (posts.length === 0) {
            logger.info("No posts found for deletion.");
            return;
        }

        logger.info(`Deleting ${posts.length} posts...`);
        const deletePromises = posts.map(post =>
            bot.telegram.deleteMessage(post.telegramChannelId, post.messageId)
        );

        await Promise.all(deletePromises);
        logger.info(`All posts deleted successfully.`);

        logger.info("Truncating current posts table...");
        await truncateCurrentPosts();
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`Failed to delete posts: ${error.message}`);
        } else {
            logger.error(`Failed to delete posts: Unknown error`);
        }
    }
}
