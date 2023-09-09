(async () => {
  // wait for a promise to finish
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  // wait for a promise to finish
  await sleep(100);

  console.log('Hello from load-next-video.ts')
  // TODO: load video from DB and replace video.mp4 once the duration is over

  process.exit(0)
})();