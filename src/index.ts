import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import Queue from './queue';

const main = async () => {
  const app = express();

  app.get('/audio.mp3', (req, res) => {
    res
      .set({
        'Content-Type': 'audio/mp3',
        'Transfer-Encoding': 'chunked'
      })
      .status(200);

    const queue = new Queue(res);

    queue.loadTracksFromFolder('./assets');
    queue.next();
  });

  return Promise.all([
    app.listen(6969, () => {
      console.log('Server running on port http://localhost:6969/audio.mp3');
    }),
    new Promise((resolve, reject) => {
      ffmpeg()
        .input('./assets/bunny.mp4')
        .addInputOption('-stream_loop -1')
        .input('http://localhost:6969/audio.mp3') // https://localhost:3000/audio.mp3
        .addInputOption('-stream_loop -1')
        .addOption('-map', '0:v')
        .addOption('-map', '1:a')
        .addInputOption('-re')
        .videoCodec('copy')
        .on('start', (commandLine) => {
          console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('error', (e) => {
          return reject(e);
        })
        .on('end', () => {
          return resolve('Resolved');
        })
        .format('flv')
        .output('rtmp://localhost/live/bunny', {
          end: true
        })
        .run();
    })
  ]);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
