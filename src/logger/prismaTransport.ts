import Transport from 'winston-transport';
import {prisma} from "../repositories/currentPostRepository";

interface LogInfo {
    level: string;
    message: string;
    timestamp?: string;
}

export class PrismaTransport extends Transport {
    constructor(opts?: any) {
        super(opts);
    }

    log(info: LogInfo, callback: () => void) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        prisma.log.create({
            data: {
                level: info.level,
                message: info.message,
            },
        }).catch((error: any) => {
            console.error("Error writing log to database:", error);
        }).finally(() => {
            callback();
        });
    }
}
