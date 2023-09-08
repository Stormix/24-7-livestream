import ffmpeg from 'fluent-ffmpeg';

import Fastify from 'fastify';

const main = async () => {
  const fastify = Fastify({
    logger: true
  });

  // Declare a route
  fastify.get('/stream', function (request, reply) {
    reply.send({ hello: 'world' });
  });

  // Fetch songs from a playlist
  // Pick a random video from the rotation
  // Stream video with the songs audio

  // ffmpeg -re -stream_loop -1 -i .\assets\bunny.mp4 -c copy -f flv rtmp://localhost/live/bunny

  // .inputOptions('-re')
  // .videoCodec('copy')
  // .format('flv')
  // .loop('-1')

  // Run the server!
  fastify.listen({ port: 3000 }, function (err) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    // Server is now listening on ${address}
    console.log('Server is now listening on 3000');
  });

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('./assets/bunny.mp4')
      .addInputOption('-stream_loop -1')
      .input('https://listen.moe/opus') // https://localhost:3000/audio.mp3
      .addInputOption('-stream_loop -1')
      .addOption('-map', '0:v')
      .addOption('-map', '1:a')
      .addInputOption('-re')
      .videoCodec('copy')
      .on('start', (commandLine) => {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('progress', (progress) => {
        console.log('Processing: ' + progress.percent + '% done');
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
  });
};

main()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
