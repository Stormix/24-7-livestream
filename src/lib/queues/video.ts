import { LoadNextVideoJobData } from '@/jobs/load-next-video';
import { env } from '@/lib/env';
import { Track } from '@/types/queue';
import { TrackType } from '@prisma/client';
// import { getVideoDurationInSeconds } from 'get-video-duration';
import { add } from 'date-fns';
import { globSync } from 'glob';
import { v4 } from 'uuid';
import Queue from '.';
import Livestream from '../livestream';

/**
 * A queue for video tracks.
 */
class VideoQueue extends Queue<Track> {
  constructor(livestream: Livestream) {
    super(livestream, env.VIDEO_DIRECTORY);
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
      // Skip video.mp4
      if (track.endsWith('video.mp4')) {
        continue;
      }
      this.enqueue({
        id: v4(),
        path: track
      });
    }
  }

  async start() {
    // Get current file duration
    // const track = this.current;
    // const duration = await getVideoDurationInSeconds(track.path);
    const nextVideo = this.peek();

    const scheduleAt = add(new Date(), { seconds: 60 });

    this._logger.info(`Scheduling next video (${nextVideo.path}) to load at ${scheduleAt.toISOString()}`);

    // schedule a task to replace the video.mp4 file with the next video
    this.livestream.agenda.schedule(scheduleAt, 'load-next-video', {
      videoPath: nextVideo.path
    } as LoadNextVideoJobData);
  }
}

export default VideoQueue;
