import {getStreamInfo} from "./api";

export async function getStreamData(streamerUsername: string): Promise<StreamData | null> {
    try {
        const apiRes = await getStreamInfo(streamerUsername);
        if (!apiRes) return null;

        const {title, game_name: category, started_at, viewer_count: viewerCount} = apiRes;

        if (!title || !category || !started_at || viewerCount == null) {
            return null;
        }

        return {
            title,
            category,
            startedAt: new Date(started_at),
            viewerCount,
        };
    } catch (error) {
        console.error(`Error fetching stream data for ${streamerUsername}:`, error);
        return null;
    }
}