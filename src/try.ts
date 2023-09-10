import Ffmpeg from 'fluent-ffmpeg';

const main = async () => {
  const file = './assets/videos/bunny.mp4';

  return Ffmpeg.ffprobe(file, async (err, metadata) => {
    console.log(err, metadata);
  });
};

main()
  .then((res) => {
    console.log('Done', res);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
