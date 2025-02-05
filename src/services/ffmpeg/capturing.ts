import {exec} from 'node:child_process';
import path from 'path';
import fs from 'fs';
import {logger} from '../../logger/logger';
import {botConfig} from '../../config/config';

export async function captureStreamSegmentUsingStreamlink(streamerUsername: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const outputDir = path.join(__dirname, '../../storage/tmp/');
        const outputFile = path.join(outputDir, `${streamerUsername}.gif`);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, {recursive: true});
        }
        
        const segmentDuration = botConfig.SEGMENT_DURATION || 5;
        const fps = botConfig.FPS || 10;
        const scaleWidth = botConfig.SCALE_WIDTH || 420;

        const command = `streamlink twitch.tv/${streamerUsername} best --stdout --twitch-disable-ads | ffmpeg -y -i - -t ${segmentDuration} -vf "fps=${fps},scale=${scaleWidth}:-1:flags=lanczos" ${outputFile}`;

        logger.info(`Executing command: ${command}`);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                logger.error(`Error executing command: ${error.message}`);
                return reject(error);
            }
            logger.info('Stream segment captured and converted to GIF successfully.');
            resolve(outputFile);
        });
    });
}
