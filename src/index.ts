import { AUDIO_ENDPOINT } from '@/config/app';
import bree from '@/lib/bree';
import { env } from '@/lib/env';
import Logger from '@/lib/logger';
import AudioQueue from '@/lib/queues/audio';
import Graceful from '@ladjs/graceful';
import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import http from 'http';
import retry from 'p-retry';

const logger = new Logger({name: 'main'});

const main = async () => {
  const app = express();
  const server = http.createServer(app);

  app.get(AUDIO_ENDPOINT, (_, res) => {
    res
      .set({
        'Content-Type': 'audio/mp3',
        'Transfer-Encoding': 'chunked'
      })
      .status(200);

    return new AudioQueue(res).next();
  });

  server.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT}! (${env.NODE_ENV})`);
    logger.info(`- Audio stream running on http://localhost:${env.PORT}${AUDIO_ENDPOINT}`);
  });

  const graceful = new Graceful({
    servers: [],
    brees: [bree],
    logger: new Logger({name: 'graceful'})
  });

  graceful.listen();

  bree.start();

  return new Promise((resolve, reject) => ffmpeg()
      .input(`list.txt`)
      .addInputOption('-f concat')
      .addInputOption('-stream_loop -1')
      .input(`http://localhost:${env.PORT}${AUDIO_ENDPOINT}`)
      .addInputOption('-stream_loop -1')
      .addOption('-map', '0:v')
      .addOption('-map', '1:a')
      .addInputOption('-re')
      .videoCodec('copy')
      .on('start', () => {
        logger.info('Started Live Stream on: ' + env.STREAM_URL);
      })
      .on('error', (e) => {
        server.close();
        reject(e);
      })
      .on('end', () => resolve('Resolved'))
      .format('flv')
      .output(`${env.STREAM_URL}/${env.STREAM_KEY}`, {
        end: true
      })
      .run()
  );
};

retry(main, {
  onFailedAttempt: (error) => {
    logger.warn(`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`);
  },
  retries: env.isDev ? 0 : env.RETRIES
}).catch((error) => {
  logger.error('FATAL:' + error.message);
  console.error(error)
  process.exit(1);
});
