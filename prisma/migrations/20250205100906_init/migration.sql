-- CreateTable
CREATE TABLE "CurrentPost" (
    "streamerUsername" TEXT NOT NULL,
    "telegramChannelId" BIGINT NOT NULL,
    "messageId" BIGINT NOT NULL,

    CONSTRAINT "CurrentPost_pkey" PRIMARY KEY ("streamerUsername")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);
