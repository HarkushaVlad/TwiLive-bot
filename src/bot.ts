import {Telegraf} from "telegraf";
import {botConfig} from "./config/config";
import axios from "axios";

const bot = new Telegraf(botConfig.TELEGRAM_BOT_TOKEN);

async function getTwitchToken() {
    const response = await axios.post(
        `https://id.twitch.tv/oauth2/token?client_id=${botConfig.TWITCH_CLIENT_ID}&client_secret=${botConfig.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
    );
    return response.data.access_token;
}

async function checkStreamStatus() {
    try {
        const token = await getTwitchToken();

        const response = await axios.get('https://api.twitch.tv/helix/streams', {
            headers: {
                'Client-ID': botConfig.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
            },
            params: {
                user_login: botConfig.STREAMER_USERNAME,
            },
        });

        return response.data.data.length > 0;
    } catch (error) {
        console.error('Error while check stream status:', error);
        return false;
    }
}

bot.command('test', async (ctx) => {
    const isLive = await checkStreamStatus();

    if (isLive) {
        await ctx.reply(`🎮 ${botConfig.STREAMER_USERNAME} is live now!`);
    } else {
        await ctx.reply(`😴 ${botConfig.STREAMER_USERNAME} is offline`);
    }
});

const startBot = () => {
    bot.launch();
    console.log('🤖 Bot is running..');

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

export default startBot;