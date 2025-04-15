import {spawn} from 'node:child_process';
import path from 'path';
import fs from 'fs';
import {logger} from '../../logger/logger';
import {botConfig} from '../../config/config';

export async function captureStreamSegmentUsingStreamlink(
    streamerUsername: string,
    maxRetries = 3,
    retryDelay = 2000
): Promise<string> {
    let retries = 0;

    while (retries <= maxRetries) {
        try {
            return await new Promise((resolve, reject) => {
                const outputDir = path.join(__dirname, '../../storage/tmp/');
                const outputFile = path.join(outputDir, `${streamerUsername}.gif`);

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, {recursive: true});
                    logger.info(`Created directory for temporary storage: ${outputDir}`);
                }

                const segmentDuration = botConfig.SEGMENT_DURATION || 5;
                const fps = botConfig.FPS || 10;
                const scaleWidth = botConfig.SCALE_WIDTH || 420;

                const streamlinkProcess = spawn('streamlink', [
                    `twitch.tv/${streamerUsername}`,
                    '480p',
                    '--stdout',
                    '--twitch-disable-ads',
                    '--retry-streams', '5',
                    '--retry-max', '3',
                    '--retry-open', '3',
                ]);

                const ffmpegProcess = spawn('ffmpeg', [
                    '-y',
                    '-i', '-',
                    '-t', segmentDuration.toString(),
                    '-vf', `fps=${fps},scale=${scaleWidth}:-1:flags=lanczos`,
                    outputFile,
                ]);

                const timeout = setTimeout(() => {
                    streamlinkProcess.kill();
                    ffmpegProcess.kill();
                    reject(new Error('Process timeout'));
                }, 30000);

                streamlinkProcess.stdout.pipe(ffmpegProcess.stdin);

                streamlinkProcess.on('error', (err) => {
                    clearTimeout(timeout);
                    logger.error(`Streamlink error for ${streamerUsername}: ${err.message}`);
                    reject(err);
                });

                streamlinkProcess.stderr.on('data', (data) => {
                    const message = data.toString();
                    if (message.includes('error') || message.includes('warning')) {
                        logger.warn(`Streamlink stderr for ${streamerUsername}: ${message}`);
                    }
                });

                ffmpegProcess.on('error', (err) => {
                    clearTimeout(timeout);
                    logger.error(`FFmpeg error for ${streamerUsername}: ${err.message}`);
                    reject(err);
                });

                ffmpegProcess.stderr.on('data', (data) => {
                    const message = data.toString();
                    if (message.includes('error') || message.includes('warning')) {
                        logger.warn(`FFmpeg stderr for ${streamerUsername}: ${message}`);
                    }
                });

                ffmpegProcess.on('close', (code) => {
                    clearTimeout(timeout);
                    if (code === 0) {
                        logger.info(`Stream segment captured successfully for ${streamerUsername}: ${outputFile}`);
                        resolve(outputFile);
                    } else {
                        logger.error(`FFmpeg process for ${streamerUsername} exited with code ${code}`);
                        reject(new Error(`FFmpeg process exited with code ${code}`));
                    }
                });

                streamlinkProcess.on('close', (code) => {
                    clearTimeout(timeout);
                    if (code !== 0) {
                        logger.error(`Streamlink process for ${streamerUsername} exited with code ${code}`);
                        reject(new Error(`Streamlink process exited with code ${code}`));
                    }
                });

                ffmpegProcess.stdin.on('error', (err: NodeJS.ErrnoException) => {
                    clearTimeout(timeout);
                    if (err.code === 'EPIPE') {
                        logger.debug(`Ignoring EPIPE error for ${streamerUsername}`);
                    } else {
                        logger.error(`Error in ffmpeg stdin for ${streamerUsername}: ${err.message}`);
                        reject(err);
                    }
                });
            });
        } catch (error) {
            retries++;
            logger.warn(`Retry attempt ${retries}/${maxRetries} for ${streamerUsername} due to: ${error}`);

            if (retries > maxRetries) {
                logger.error(`Max retries exceeded for ${streamerUsername}`);
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    throw new Error(`Failed to capture stream segment after ${maxRetries} retries`);
}