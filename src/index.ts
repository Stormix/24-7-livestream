import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import retry from 'p-retry';
import { AUDIO_ENDPOINT, VIDEO_ENDPOINT } from './config/app';
import { env } from './env';
import { http, logger } from './logger';
import AudioQueue from './queues/audio';
import VideoQueue from './queues/video';

const main = async () => {
  const app = express();

  app.use(http);

  app.get(AUDIO_ENDPOINT, (_, res) => {
    res
      .set({
        'Content-Type': 'audio/mp3',
        'Transfer-Encoding': 'chunked'
      })
      .status(200);

    return new AudioQueue(res).next();
  });

  app.get(VIDEO_ENDPOINT, (_, res) => {
    res
      .set({
        'Content-Type': 'video/mp4',
        'Transfer-Encoding': 'chunked'
      })
      .status(200);

    return new VideoQueue(res).next();
  });

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port http://localhost:${env.PORT}`);
    logger.info(`> Audio stream running on http://localhost:${env.PORT}${AUDIO_ENDPOINT}`);
    logger.info(`> Video stream running on http://localhost:${env.PORT}${VIDEO_ENDPOINT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.debug('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.debug('HTTP server closed');
    });
  });

  return new Promise((resolve, reject) =>
    ffmpeg()
      .input(`http://localhost:${env.PORT}${VIDEO_ENDPOINT}`)
      .addInputOption('-stream_loop -1')
      .input(`http://localhost:${env.PORT}${AUDIO_ENDPOINT}`) // http://hyades.shoutca.st:8043/stream
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
  retries: 4
}).catch((error) => {
  logger.error('FATAL:' + error.message);
  process.exit(1);
});
