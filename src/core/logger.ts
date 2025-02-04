interface LoggerInterface {
    info(message: string): void;

    warn(message: string): void;

    error(message: string): void;

    debug?(message: string): void;
}

class ConsoleLogger implements LoggerInterface {
    info(message: string) {
        console.log(`INFO: ${message}`);
    }

    warn(message: string) {
        console.warn(`WARN: ${message}`);
    }

    error(message: string) {
        console.error(`ERROR: ${message}`);
    }

    debug(message: string) {
        console.debug(`DEBUG: ${message}`);
    }
}

export const consoleLogger = new ConsoleLogger();
