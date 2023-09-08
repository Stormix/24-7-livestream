import { createReadStream } from 'fs';
import Throttle from 'throttle';
import { QueueItem as Item } from '../types/queue';

abstract class Queue<T extends Item> {
  protected _queue: T[];
  protected _throttle!: Throttle;
  protected _stream: NodeJS.WritableStream;
  protected _current: number = 0;

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
   * Plays the next audio track in the queue.
   */
  next() {
    this._current = (this._current + 1) % this._queue.length;
    this.start();
  }

  /**
   * Gets the currently playing audio track.
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
  abstract start(): void;
}

export default Queue;
