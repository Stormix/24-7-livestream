import { env } from '@/lib/env';
import { Track } from '@/types/queue';
import { TrackType } from '@prisma/client';
import { globSync } from 'glob';
import Throttle from 'throttle';
import { v4 } from 'uuid';
import Queue from '.';
import Livestream from '../livestream';

/**
 * A queue for video tracks.
 */
class VideoQueue extends Queue<Track> {
  constructor(livestream: Livestream, stream: NodeJS.WritableStream) {
    super(livestream, stream, env.VIDEO_DIRECTORY);
  }

  async loadFromDB() {
    this._logger.info('Loading video tracks from database');
    const tracks = await this.livestream.prisma.track.findMany({
      where: {
        type: TrackType.VIDEO
      }
    });

    for (const track of tracks) {
      this.enqueue({
        id: track.id,
        path: track.path
      });
    }
  }

  /**
   * Loads tracks from a folder.
   * @param {string} path - The path to the folder.
   */
  async loadFromFolder(path: string) {
    this._logger.info(`Loading video tracks from ${path}`);
    for (const track of globSync(`${path}/**/*.mp4`)) {
      this.enqueue({
        id: v4(),
        path: track
      });
    }
  }

  async start(): Promise<NodeJS.ReadableStream> {
    const track = this.current;
    const bitrate = await this.bitrate(track);

    this._logger.info('Starting track', track.path, bitrate);

    this._throttle = new Throttle(bitrate / 8);

    return this.current.stream
      .pipe(this._throttle)
      .on('data', (chunk) => {
        this._stream.write(chunk);
      })
      .on('end', () => {
        this.next();
      })
      .on('error', (e) => {
        this._logger.error('Failed to throttle: ', e);
        this.next();
      });
  }
}

export default VideoQueue;
