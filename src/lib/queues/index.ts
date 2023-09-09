import { AUDIO_BITRATE } from '@/config/app';
import Logger from '@/lib/logger';
import { QueueItem as Item } from '@/types/queue';
import ffmpeg from 'fluent-ffmpeg';
import { createReadStream } from 'fs';
import Throttle from 'throttle';

abstract class Queue<T extends Item> {
  protected _queue: T[];
  protected _throttle!: Throttle;
  protected _stream: NodeJS.WritableStream;
  protected _current: number = 0;
  protected _logger: Logger = new Logger({name: this.constructor.name})

  /**
   * Creates a new Queue instance.
   * @param stream The stream to write audio data to.
   * @param folder The folder to load audio tracks from.
   */
  constructor(stream: NodeJS.WritableStream, folder?: string) {
    this._queue = [];
    this._stream = stream;
    this.loadFromFolder(folder ?? './assets');
  }

  enqueue(item: T) {
    this._queue.push(item);
  }

  dequeue() {
    return this._queue.shift();
  }

  isEmpty() {
    return this._queue.length === 0;
  }

  
  /**
   * Gets the bitrate of an audio track.
   * @param track The audio track to get the bitrate of.
   * @returns A promise that resolves to the bitrate in bits per second.
   */
  bitrate(track: T) {
    return new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(track.path, (err, metadata) =>
        err ? reject(err) : resolve(metadata.format.bit_rate ?? AUDIO_BITRATE)
      );
    });
  }

  
  /**
   * Plays the next audio track in the queue.
   */
  next() {
    this._current = (this._current + 1) % this._queue.length;
    this.start();
  }

  /**
   * Gets the curre ntly playing audio track.
   * @returns An object representing the currently playing audio track.
   */
  get current() {
    return {
      ...this._queue[this._current],
      stream: createReadStream(this._queue[this._current].path)
    };
  }

  /**
   * Loads items from a folder.
   * @param path The path to the folder to load items from.
   */
  abstract loadFromFolder(path: string): void;

  /**
   * Starts playing the current track.
   */

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

export default Queue;
