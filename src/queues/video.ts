import { globSync } from 'glob';
import { v4 } from 'uuid';
import { Track } from '../types/queue';
import Queue from './base';

/**
 * A queue for video tracks.
 */
class VideoQueue extends Queue<Track> {
  /**
   * Loads tracks from a folder.
   * @param {string} path - The path to the folder.
   */
  async loadFromFolder(path: string) {
    for (const track of globSync(`${path}/**/*.mp4`)) {
      this.enqueue({
        id: v4(),
        path: track
      });
    }
  }

  async start() {
    return this.current.stream
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

export default VideoQueue;
