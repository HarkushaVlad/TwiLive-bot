import dotenv from 'dotenv';
import {logger} from "../logger/logger";

dotenv.config();

interface BotConfig {
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_CHANNEL_ID: string;
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    STREAMER_USERNAME: string;
    SEGMENT_DURATION: number;
    FPS: number;
    SCALE_WIDTH: number;
}

const loadConfig = (): BotConfig => {
    const requiredVariables = [
        'TELEGRAM_BOT_TOKEN',
        'TELEGRAM_CHANNEL_ID',
        'TWITCH_CLIENT_ID',
        'TWITCH_CLIENT_SECRET',
        'SEGMENT_DURATION',
        'FPS',
        'SCALE_WIDTH'
    ];

    for (const varName of requiredVariables) {
        if (!process.env[varName]) {
            logger.error(`Missing required environment variable ${varName}`);
            process.exit(1);
        }
    }

    return {
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
        TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID!,
        TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID!,
        TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET!,
        STREAMER_USERNAME: process.env.STREAMER_USERNAME!,
        SEGMENT_DURATION: Number(process.env.SEGMENT_DURATION!),
        FPS: Number(process.env.FPS!),
        SCALE_WIDTH: Number(process.env.SCALE_WIDTH!)
    };
};

export const botConfig = loadConfig();