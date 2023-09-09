import { globSync } from 'glob';
import { v4 } from 'uuid';
import Queue from '.';
import { env } from '../env';
import { Track } from '../types/queue';

/**
 * A queue of audio tracks to be played.
 */
class AudioQueue extends Queue<Track> {
  constructor(stream: NodeJS.WritableStream) {
    super(stream, env.AUDIO_DIRECTORY);
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

}

export default AudioQueue;
