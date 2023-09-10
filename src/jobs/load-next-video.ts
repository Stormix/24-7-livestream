import Logger from '@/lib/logger';
import { Job } from '@hokify/agenda';
import { copyFile } from 'fs/promises';
import { join } from 'path';

export interface LoadNextVideoJobData {
  videoPath: string;
}

const logger = new Logger({
  name: 'jobs:load-next-video'
});
const loadNextVideo = async (job: Job<LoadNextVideoJobData>) => {
  const { videoPath } = job.attrs.data;

  await copyFile(videoPath, join(__dirname, '..', '..', './assets/videos/video.mp4'));
  logger.info(`Moved ${videoPath.split('/').pop()} to assets/videos/video.mp4`);
};

export default loadNextVideo;
