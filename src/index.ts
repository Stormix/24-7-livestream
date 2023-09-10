import Logger from '@/lib/logger';
import Livestream from './lib/livestream';

const logger = new Logger({ name: 'main' });

const main = async () => {
  const livestream = new Livestream();
  return livestream.start();
};

main().catch((error) => {
  logger.error('FATAL:' + error.message);
  console.error(error);
  process.exit(1);
});
