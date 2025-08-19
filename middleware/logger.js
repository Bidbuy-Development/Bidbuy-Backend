/**
 * Logger middleware for consistent logging throughout the application
 * Use this instead of console.log for better control and consistency
 */

const isProduction = process.env.NODE_ENV === 'production';

const logger = {
    /**
     * Log debug information (only in development)
     * @param {...any} messages - Messages to log
     */
    debug: (...messages) => {
        if (!isProduction) {
            console.log('[DEBUG]', ...messages);
        }
    },
    
    /**
     * Log general information
     * @param {...any} messages - Messages to log
     */
    info: (...messages) => {
        console.log('[INFO]', ...messages);
    },
    
    /**
     * Log warnings
     * @param {...any} messages - Warning messages
     */
    warn: (...messages) => {
        console.warn('[WARN]', ...messages);
    },
    
    /**
     * Log errors
     * @param {Error|string} error - Error object or message
     * @param {string} [context] - Additional context for the error
     */
    error: (error, context = '') => {
        if (error instanceof Error) {
            console.error(`[ERROR] ${context}`, error.message, '\n', error.stack);
        } else {
            console.error(`[ERROR] ${context}`, error);
        }
    },
    
    /**
     * Log critical errors that require immediate attention
     * @param {Error|string} error - Error object or message
     * @param {string} [context] - Additional context for the error
     */
    critical: (error, context = '') => {
        const message = `[CRITICAL] ${context} ${error instanceof Error ? error.message : error}`;
        console.error(message);
        // Here you could also integrate with an error tracking service
        // e.g., Sentry.captureException(error);
    }
};

export default logger;
