import pino from 'pino-http';
import { env } from './env';

export const http = pino({
  ...(env.isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            messageFormat: '{context} | {msg}',
            ignore: 'pid,hostname'
          }
        }
      })
});

export const logger = http.logger;
