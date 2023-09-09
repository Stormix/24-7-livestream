import { Track } from '@/types/queue';
import { globSync } from 'glob';
import Throttle from 'throttle';
import { v4 } from 'uuid';
import Queue from '.';
import { env } from '@/lib/env';

/**
 * A queue for video tracks.
 */
class VideoQueue extends Queue<Track> {

  constructor(stream: NodeJS.WritableStream,) {
    super(stream, env.VIDEO_DIRECTORY);
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
        this._logger.error("Failed to throttle: ",e);
        this.next();
      });
  }
}

export default VideoQueue;
