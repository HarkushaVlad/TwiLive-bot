import {spawn} from 'node:child_process';
import path from 'path';
import fs from 'fs';
import {logger} from '../../logger/logger';
import {botConfig} from '../../config/config';

const TMP_DIR = path.join(__dirname, '../../storage/tmp/');

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
        logger.info(`Created directory: ${dir}`);
    }
}

function runProcess(cmd: string, args: string[], timeoutMs: number, logPrefix: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args);

        let stderrOutput = "";
        let stdoutOutput = "";

        const timeout = setTimeout(() => {
            logger.warn(`[${logPrefix}] Process timeout, sending SIGINT`);
            proc.kill('SIGINT');
            setTimeout(() => {
                if (!proc.killed) {
                    logger.warn(`[${logPrefix}] Process didn't stop after SIGINT, killing`);
                    proc.kill('SIGKILL');
                }
            }, 4000);
        }, timeoutMs);

        proc.on('error', err => {
            clearTimeout(timeout);
            logger.error(`[${logPrefix}] Process error: ${err.message}`);
            reject(err);
        });

        proc.stderr.on('data', data => {
            const msg = data.toString();
            stderrOutput += msg;
            if (msg.match(/error|warning/i)) {
                logger.warn(`[${logPrefix}] ${msg.trim()}`);
            }
        });

        proc.stdout.on('data', data => {
            const msg = data.toString();
            stdoutOutput += msg;
        });

        proc.on('close', code => {
            clearTimeout(timeout);
            if (code === 130) {
                logger.info(`[${logPrefix}] exited with code 130 (SIGINT)`);
                resolve();
            } else if (code !== 0) {
                logger.error(
                    `[${logPrefix}] exited with code ${code}\nFull stderr:\n${stderrOutput.trim()}\nFull stdout:\n${stdoutOutput.trim()}`
                );
                reject(new Error(
                    `${cmd} exited with code ${code}` +
                    (stderrOutput ? `\n[stderr]:\n${stderrOutput.trim()}` : "") +
                    (stdoutOutput ? `\n[stdout]:\n${stdoutOutput.trim()}` : "")
                ));
            } else {
                resolve();
            }
        });
    });
}

async function convertToGif(
    input: string,
    output: string,
    duration: number,
    fps: number,
    scaleWidth: number,
    streamerUsername: string
) {
    await runProcess('ffmpeg', [
        '-y', '-i', input,
        '-t', duration.toString(),
        '-vf', `fps=${fps},scale=${scaleWidth}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        output
    ], 45000, `FFmpeg[${streamerUsername}]`);
    try {
        fs.unlinkSync(input);
    } catch (e) {
    }
}

async function captureSegmentWithStreamlink(
    streamerUsername: string,
    segmentDuration: number,
    fps: number,
    scaleWidth: number,
    maxRetries = 3,
    retryDelay = 2000
): Promise<string> {
    const tempVideoFile = path.join(TMP_DIR, `${streamerUsername}_temp.mp4`);
    const outputFile = path.join(TMP_DIR, `${streamerUsername}.gif`);
    let retries = 0;
    const totalTimeoutMs = segmentDuration * 1000 + 30000;
    ensureDir(TMP_DIR);

    if (fs.existsSync(tempVideoFile)) {
        fs.unlinkSync(tempVideoFile);
    }

    logger.info(`Capture via streamlink for ${streamerUsername}`);
    while (retries <= maxRetries) {
        try {
            await runProcess('streamlink', [
                `twitch.tv/${streamerUsername}`, 'best',
                '-o', tempVideoFile,
                '--force',
                '--twitch-disable-ads', '--twitch-low-latency',
                '--retry-streams', '10', '--retry-max', '5', '--retry-open', '5',
                '--stream-timeout', String(segmentDuration + 5), '--ringbuffer-size', '32M'
            ], totalTimeoutMs, `streamlink[${streamerUsername}]`);
            await convertToGif(tempVideoFile, outputFile, segmentDuration, fps, scaleWidth, streamerUsername);
            return outputFile;
        } catch (error) {
            retries++;
            logger.warn(`streamlink retry ${retries}/${maxRetries} for ${streamerUsername}: ${error}`);
            if (retries > maxRetries) throw new Error(`streamlink max retries exceeded`);
            await new Promise(res => setTimeout(res, retryDelay));
        }
    }
    throw new Error(`Failed to capture stream segment with streamlink after ${maxRetries} retries`);
}

async function captureSegmentWithYtdlp(
    streamerUsername: string,
    segmentDuration: number,
    fps: number,
    scaleWidth: number
): Promise<string> {
    const tempVideoFile = path.join(TMP_DIR, `${streamerUsername}_temp.mp4`);
    const outputFile = path.join(TMP_DIR, `${streamerUsername}.gif`);
    ensureDir(TMP_DIR);
    logger.info(`Capture via yt-dlp for ${streamerUsername}`);
    await runProcess('yt-dlp', [
        `https://twitch.tv/${streamerUsername}`,
        '--format', 'best[height<=720]', '-f', 'b',
        '--no-playlist', '--no-continue', '--no-part',
        '-S', 'res:720', '--socket-timeout', '30', '--retries', '5',
        '-o', tempVideoFile,
        '--downloader-args', `ffmpeg_i:-t ${segmentDuration}`
    ], 45000, `yt-dlp[${streamerUsername}]`);
    await convertToGif(tempVideoFile, outputFile, segmentDuration, fps, scaleWidth, streamerUsername);
    logger.info(`Stream segment converted to GIF for ${streamerUsername}: ${outputFile}`);
    return outputFile;
}

export async function captureStreamSegment(
    streamerUsername: string,
    maxRetries = 3,
    retryDelay = 2000
): Promise<string> {
    const segmentDuration = botConfig.SEGMENT_DURATION || 5;
    const fps = botConfig.FPS || 10;
    const scaleWidth = botConfig.SCALE_WIDTH || 480;

    return await captureSegmentWithStreamlink(
        streamerUsername,
        segmentDuration,
        fps,
        scaleWidth,
        maxRetries,
        retryDelay
    );
}