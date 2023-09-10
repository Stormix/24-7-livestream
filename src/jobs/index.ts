import Livestream from '@/lib/livestream';
import { glob } from 'glob';

const registerJobs = async (livestream: Livestream) => {
  const jobs = glob.sync('**/*.ts', { cwd: __dirname, ignore: ['index.ts'] });

  for (const job of jobs) {
    const jobName = job.replace('.ts', '');
    const jobFn = (await import(`./${jobName}`)).default;

    livestream.agenda.define(jobName, jobFn);
  }

  livestream.agenda.on('complete', (job) => {
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (job.attrs.name) {
      case 'load-next-video':
        livestream.logger.info('Next video has been loaded, scheduling the next one...');
        livestream.videoQueue.next();
        break;
      default:
        console.log('Unknown job completed', job.attrs.name);
    }
  });
};

export default registerJobs;
