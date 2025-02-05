import winston from 'winston';
import {PrismaTransport} from './prismaTransport';

const logFormat = winston.format.printf(({level, message, timestamp}) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        logFormat
    ),
    transports: [
        new winston.transports.Console(),
        new PrismaTransport()
    ]
});
