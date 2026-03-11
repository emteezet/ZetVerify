/**
 * @description Centralized logging utility for structured logs.
 */
export class Logger {
    static info(message, payload = {}) {
        console.log(this._format('INFO', message, payload));
    }

    static warn(message, payload = {}) {
        console.warn(this._format('WARN', message, payload));
    }

    static error(message, error = {}, payload = {}) {
        const errorPayload = {
            message: error.message,
            code: error.code || 'UNKNOWN',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            ...payload,
        };
        console.error(this._format('ERROR', message, errorPayload));
    }

    static _format(level, message, payload) {
        const timestamp = new Date().toISOString();
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...payload,
        }, null, 2);
    }
}
