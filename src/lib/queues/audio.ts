import { Track } from '@/types/queue';
import { TrackType } from '@prisma/client';
import { createReadStream, existsSync } from 'fs';
import { globSync } from 'glob';
import Throttle from 'throttle';
import { v4 } from 'uuid';
import Queue from '.';
import { env } from '../env';
import Livestream from '../livestream';
import { downloadFile } from '../utils';

/**
 * A queue of audio tracks to be played.
 */
class AudioQueue extends Queue<Track> {
  constructor(livestream: Livestream) {
    super(livestream, env.AUDIO_DIRECTORY);
  }

  async loadFromDB() {
    this._logger.info('Loading video tracks from database');
    const tracks = await this.livestream.prisma.track.findMany({
      where: {
        type: TrackType.AUDIO
      }
    });

    this._logger.info('Loaded tracks from database', tracks.length);

    for (const track of tracks) {
      this.enqueue({
        id: track.id,
        path: track.path
      });
    }
  }

  /**
   * Loads audio tracks from a folder.
   * @param path The path to the folder to load audio tracks from.
   */
  async loadFromFolder(path: string) {
    this._logger.info('Loading audio tracks from folder', { path });
    for (const track of globSync(`${path}/**/*.mp3`)) {
      this.enqueue({
        id: v4(),
        path: track
      });
    }
  }

  /**
   * Starts playing the current track.
   */
  async start(response?: NodeJS.WritableStream): Promise<void> {
    if (!response) return;

    const track = this.current;
    const bitrate = await this.bitrate(track);

    this._logger.info('Starting track', track.path, bitrate);

    this._throttle = new Throttle(bitrate / 8);

    let stream: NodeJS.ReadableStream;

    if (this.current.path.startsWith('http')) {
      const tmpFile = `${this.livestream.tmpDir!.path}/${this.current.id}.mp3`;
      if (!existsSync(tmpFile)) {
        this._logger.info('Downloading track to temp file', tmpFile);
        await downloadFile(this.current.path, tmpFile);
      }
      stream = createReadStream(tmpFile);
    } else {
      stream = createReadStream(this.current.path);
    }

    stream
      .pipe(this._throttle)
      .on('data', (chunk) => {
        response.write(chunk);
      })
      .on('end', () => {
        this.next(response);
      })
      .on('error', (e) => {
        this._logger.error('Failed to throttle: ', e);
        this.next(response);
      });
  }
}

export default AudioQueue;
