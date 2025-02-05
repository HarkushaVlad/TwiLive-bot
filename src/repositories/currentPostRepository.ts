import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export async function getCurrentPostId(streamerUsername: string): Promise<number | null> {
    const record = await prisma.currentPost.findUnique({
        where: {streamerUsername}
    });

    return record ? Number(record.messageId) : null;
}

export async function saveCurrentPostId(
    streamerUsername: string,
    telegramChannelId: number,
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
