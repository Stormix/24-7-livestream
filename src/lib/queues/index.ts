import { AUDIO_BITRATE } from '@/config/app';
import Logger from '@/lib/logger';
import { QueueItem as Item } from '@/types/queue';
import ffmpeg from 'fluent-ffmpeg';
import Throttle from 'throttle';
import Livestream from '../livestream';

abstract class Queue<T extends Item> {
  protected _queue: T[];
  protected _throttle!: Throttle;
  protected _current: number = 0;
  protected _logger: Logger = new Logger({ name: this.constructor.name });

  /**
   * Creates a new Queue instance.
   * @param stream The stream to write audio data to.
   * @param folder The folder to load audio tracks from.
   */
  constructor(
    public readonly livestream: Livestream,
    folder?: string
  ) {
    this._queue = [];

    this.loadFromFolder(folder ?? './assets');
    this.loadFromDB();
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

  peek() {
    return this._queue[(this._current + 1) % this._queue.length];
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
  next(): void;
  next(response: NodeJS.WritableStream): void;
  next(response?: NodeJS.WritableStream) {
    this._current = (this._current + 1) % this._queue.length;
    this.start(response);
  }

  /**
   * Gets the curre ntly playing audio track.
   * @returns An object representing the currently playing audio track.
   */
  get current() {
    return this._queue[this._current];
  }

  /**
   * Loads items from the database.
   */
  abstract loadFromDB(): void;

  /**
   * Loads items from a folder.
   * @param path The path to the folder to load items from.
   */
  abstract loadFromFolder(path: string): void;

  abstract start(response?: NodeJS.WritableStream): void;
}

export default Queue;
