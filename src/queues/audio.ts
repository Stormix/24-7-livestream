import ffmpeg from 'fluent-ffmpeg';
import { globSync } from 'glob';
import Throttle from 'throttle';
import { v4 } from 'uuid';
import { AUDIO_BITRATE } from '../config/app';
import { env } from '../env';
import { Track } from '../types/queue';
import Queue from './base';

/**
 * A queue of audio tracks to be played.
 */
class AudioQueue extends Queue<Track> {
  constructor(stream: NodeJS.WritableStream) {
    super(stream, env.AUDIO_DIRECTORY);
  }

  /**
   * Gets the bitrate of an audio track.
   * @param track The audio track to get the bitrate of.
   * @returns A promise that resolves to the bitrate in bits per second.
   */
  bitrate(track: Track) {
    return new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(track.path, (err, metadata) =>
        err ? reject(err) : resolve(metadata.format.bit_rate ?? AUDIO_BITRATE)
      );
    });
  }

  /**
   * Loads audio tracks from a folder.
   * @param path The path to the folder to load audio tracks from.
   */
  async loadFromFolder(path: string) {
    for (const track of globSync(`${path}/**/*.mp3`)) {
      this.enqueue({
        id: v4(),
        path: track
      });
    }
  }

  async start() {
    const track = this.current;
    const bitrate = await this.bitrate(track);

    this._throttle = new Throttle(bitrate / 8);

    return this.current.stream
      .pipe(this._throttle)
      .on('data', (chunk) => {
        this._stream.write(chunk);
      })
      .on('end', () => {
        this.next();
      })
      .on('error', () => {
        this.next();
      });
  }
}

export default AudioQueue;
