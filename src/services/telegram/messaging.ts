import {getStreamData} from "../twitch/stream";
import {captureStreamSegmentUsingStreamlink} from "../ffmpeg/capturing";
import {consoleLogger} from "../../core/logger";
import {bot} from "./bot";

function formatStreamDuration(startedAt: Date): string {
    const durationMs = Date.now() - startedAt.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    return `${hours}:${minutes}:${seconds < 10 ? `0${seconds}` : ''}`;
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

export async function sendStreamPost(channelId: number, streamerUsername: string): Promise<void> {
    try {
        const streamData = await getStreamData(streamerUsername);
        if (!streamData) throw new Error('No stream data');

        const gifPath = await captureStreamSegmentUsingStreamlink(streamerUsername);

        await bot.telegram.sendAnimation(
            channelId,
            {source: gifPath},
            {
                caption: getMessage(streamData, streamerUsername),
                parse_mode: 'HTML'
            }
        );

    } catch (error) {
        consoleLogger.error(`Error creating post: ${error}`);
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

        consoleLogger.info('Post updated successfully');
    } catch (error) {
        consoleLogger.error(`Error updating post: ${error}`);
    }
}