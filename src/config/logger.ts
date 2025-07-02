import winston from 'winston';
import { env } from './env';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
// Only use file transports if logs directory exists and is writable
const transports: winston.transport[] = [
  // Write all logs to console
  new winston.transports.Console({
    format: env.NODE_ENV === 'production' ? logFormat : consoleFormat,
  }),
];

// Only add file transports in production or if logs directory exists
if (env.NODE_ENV === 'production') {
  try {
    transports.push(
      // Write all logs with level 'error' and below to error.log
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Write all logs to combined.log
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  } catch (error) {
    // If file transport fails, continue with console only
    console.warn('Failed to initialize file transports, using console only');
  }
}

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'social-media-api' },
  transports,
  exceptionHandlers: env.NODE_ENV === 'production' ? [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ] : undefined,
  rejectionHandlers: env.NODE_ENV === 'production' ? [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ] : undefined,
});

// If we're not in production, log to the console with the simple format
if (env.NODE_ENV !== 'production') {
  logger.debug('Logging initialized at debug level');
}

export default logger;




