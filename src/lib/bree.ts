import Bree from "bree";
import path from "path";
import Logger from "./logger";

const logger = new Logger({name: 'Bree'});
const bree = new Bree({
  logger,
  jobs: ['load-next-video'],
  root: path.join(__dirname, '../', 'jobs'),
  defaultExtension: 'ts',
  acceptedExtensions: ['.js', '.ts'],
  errorHandler: (error, workerMetadata) => {
    // workerMetadata will be populated with extended worker information only if
    // Bree instance is initialized with parameter `workerMetadata: true`
    if (workerMetadata.threadId) {
      logger.info(`There was an error while running a worker ${workerMetadata.name} with thread ID: ${workerMetadata.threadId}`)
    } else {
      logger.info(`There was an error while running a worker ${workerMetadata.name}`)
    }

    logger.error(error);
  },
})

export default bree;