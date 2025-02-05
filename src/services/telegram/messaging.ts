import {getStreamData} from "../twitch/stream";
import {captureStreamSegmentUsingStreamlink} from "../ffmpeg/capturing";
import {logger} from "../../logger/logger";
import {bot} from "./bot";

function formatStreamDuration(startedAt: Date): string {
    const durationMs = Date.now() - startedAt.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    return `${hours}:${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
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

export async function sendStreamPost(channelId: number, streamerUsername: string): Promise<number> {
    try {
        const streamData = await getStreamData(streamerUsername);
        if (!streamData) throw new Error('No stream data');

        const gifPath = await captureStreamSegmentUsingStreamlink(streamerUsername);

        const message = await bot.telegram.sendAnimation(
            channelId,
            {source: gifPath},
            {
                caption: getMessage(streamData, streamerUsername),
                parse_mode: 'HTML'
            }
        );

        logger.info('Post sent successfully');
        
        return message.message_id;
    } catch (error) {
        logger.error(`Error creating post: ${error}`);
        throw error;
    }
}

export async function updateStreamPost(chatId: number, messageId: number, streamerUsername: string) {
    try {
        const streamData = await getStreamData(streamerUsername);
        if (!streamData) return;

        const gifPath = await captureStreamSegmentUsingStreamlink(streamerUsername);

        await bot.telegram.editMessageMedia(chatId, messageId, undefined, {
            type: 'animation',
            media: {source: gifPath},
            caption: getMessage(streamData, streamerUsername),
            parse_mode: 'HTML'
        });

        logger.info('Post updated successfully');
    } catch (error) {
        logger.error(`Error updating post: ${error}`);
    }
}

export async function deleteStreamPost(chatId: number, messageId: number) {
    try {
        await bot.telegram.deleteMessage(chatId, messageId);
        logger.info('Post deleted successfully');
    } catch (error) {
        logger.error(`Delete post error: ${error}`);
    }
}