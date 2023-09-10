import https from 'https';

const main = async () => {
  const url = 'https://download.samplelib.com/mp3/sample-3s.mp3';

  const streamFromUrl = (url: string) => {
    return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
      https
        .get(url, (res) => {
          resolve(res);
        })
        .on('error', (e) => {
          reject(e);
        });
    });
  };

  return (await streamFromUrl(url))
    .on('error', (e) => {
      console.error(e);
    })
    .on('data', (chunk) => {
      console.log(chunk);
    });
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
