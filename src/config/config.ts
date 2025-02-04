import dotenv from 'dotenv';
dotenv.config();

interface Config {
    TELEGRAM_BOT_TOKEN: string;
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    STREAMER_USERNAME?: string;
}

const loadConfig = (): Config => {
    const requiredVariables = [
        'TELEGRAM_BOT_TOKEN',
        'TWITCH_CLIENT_ID',
        'TWITCH_CLIENT_SECRET'
    ];

    for (const varName of requiredVariables) {
        if (!process.env[varName]) {
            throw new Error(`Missing required environment variable: ${varName}`);
        }
    }

    return {
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
        TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID!,
        TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET!,
        STREAMER_USERNAME: process.env.STREAMER_USERNAME || 'kaicenat'
    };
};

export const botConfig = loadConfig();