import bree from '@/lib/bree';
import { env } from '@/lib/env';
import Logger from '@/lib/logger';
import retry from 'p-retry';
import Livestream from './lib/livestream';

const logger = new Logger({ name: 'main' });

const main = async () => {
  const livestream = new Livestream(bree);
  return livestream.start();
};

retry(main, {
  onFailedAttempt: (error) => {
    logger.warn(`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`);
  },
  retries: env.isDev ? 0 : env.RETRIES
}).catch((error) => {
  logger.error('FATAL:' + error.message);
  console.error(error);
  process.exit(1);
});
