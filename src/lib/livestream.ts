import { AUDIO_ENDPOINT } from '@/config/app';
import registerJobs from '@/jobs';
import { Agenda } from '@hokify/agenda';
import Graceful from '@ladjs/graceful';
import { PrismaClient } from '@prisma/client';
import express, { Application } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { Server } from 'http';
import tmp from 'tmp-promise';
import { env } from './env';
import Logger from './logger';
import AudioQueue from './queues/audio';
import VideoQueue from './queues/video';

class Livestream {
  public server: Server;
  public app: Application;
  public prisma: PrismaClient;
  public logger: Logger = new Logger({ name: 'main' });
  public tmpDir: tmp.DirectoryResult | undefined = undefined;
  public graceful: Graceful;
  public audioQueue: AudioQueue;
  public videoQueue: VideoQueue;
  public agenda: Agenda;

  public liveOnStart: boolean = true;

  constructor() {
    this.app = express();
    this.prisma = new PrismaClient();
    this.server = new Server(this.app);
    this.agenda = new Agenda({ db: { address: env.DATABASE_URL } });
    this.graceful = new Graceful({
      servers: [],
      customHandlers: [async () => this.stop()],
      logger: this.logger.getSubLogger({ name: 'graceful' })
    });

    this.audioQueue = new AudioQueue(this);
    this.videoQueue = new VideoQueue(this);

    this.registerRoutes();
  }

  public async registerRoutes() {
    this.app.get(AUDIO_ENDPOINT, (_, res) => {
      res
        .set({
          'Content-Type': 'audio/mp3',
          'Transfer-Encoding': 'chunked'
        })
        .status(200);

      return this.audioQueue.next(res);
    });
  }

  public async start() {
    this.tmpDir = await tmp.dir({ unsafeCleanup: true });
    this.graceful.listen();

    await registerJobs(this);

    await this.agenda.start();
    await this.prisma.$connect();

    this.server.listen(env.PORT, () => {
      this.logger.info(`🚀 Server running on port ${env.PORT}! (${env.NODE_ENV})`);
      this.logger.info(`- Audio stream running on http://localhost:${env.PORT}${AUDIO_ENDPOINT}`);
    });

    this.videoQueue.start();

    return this.livestream();
  }

  public async stop() {
    this.server.close();
    await this.prisma.$disconnect();
    this.tmpDir?.cleanup();
    this.agenda.stop();
  }

  public async livestream() {
    if (!this.liveOnStart) return;
    return new Promise((resolve, reject) =>
      ffmpeg()
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
          this.logger.info('Started Live Stream on: ' + env.STREAM_URL);
        })
        .on('error', (e) => {
          reject(e);
        })
        .on('end', () => resolve('Resolved'))
        .format('flv')
        .output(`${env.STREAM_URL}/${env.STREAM_KEY}`, {
          end: true
        })
        .run()
    );
  }
}

export default Livestream;
