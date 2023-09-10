import { Track } from '@/types/queue';
import { TrackType } from '@prisma/client';
import { globSync } from 'glob';
import { v4 } from 'uuid';
import Queue from '.';
import { env } from '../env';
import Livestream from '../livestream';

/**
 * A queue of audio tracks to be played.
 */
class AudioQueue extends Queue<Track> {
  constructor(livestream: Livestream, stream: NodeJS.WritableStream) {
    super(livestream, stream, env.AUDIO_DIRECTORY);
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
}

export default AudioQueue;
