import {PrismaClient} from "@prisma/client";


export const prisma = new PrismaClient();

export async function getCurrentPostId(streamerUsername: string): Promise<number | null> {
    const record = await prisma.currentPost.findUnique({
        where: {streamerUsername}
    });

    return record ? record.messageId : null;
}

export async function saveCurrentPostId(
    streamerUsername: string,
    telegramChannelId: string,
    messageId: number
): Promise<void> {
    await prisma.currentPost.upsert({
        where: {streamerUsername},
        update: {messageId, telegramChannelId},
        create: {streamerUsername, telegramChannelId, messageId}
    });
}

export async function deleteCurrentPostId(streamerUsername: string): Promise<void> {
    await prisma.currentPost.delete({
        where: {streamerUsername}
    });
}

export async function truncateCurrentPosts(): Promise<void> {
    await prisma.currentPost.deleteMany({});
}
