/*
  Warnings:

  - You are about to alter the column `messageId` on the `CurrentPost` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "CurrentPost" ALTER COLUMN "telegramChannelId" SET DATA TYPE TEXT,
ALTER COLUMN "messageId" SET DATA TYPE INTEGER;
