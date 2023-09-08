import ffmpeg from 'fluent-ffmpeg';
import { createReadStream } from 'fs';
import { globSync } from 'glob';
import Throttle from 'throttle';
import { v4 } from 'uuid';

interface Track {
  id: string;
  path: string;
}

class Queue {
  private _tracks: Track[] = [];
  private _currentTrack: number = 0;
  private _throttle!: Throttle;
  private _stream: NodeJS.WritableStream;

  constructor(stream: NodeJS.WritableStream) {
    this._stream = stream;
  }

  async getBitrate(track: Track): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(track.path, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        const bitrate = metadata.format.bit_rate ?? 128000;
        return resolve(bitrate);
      });
    });
  }

  addTrack(track: Track) {
    this._tracks.push(track);
  }

  next() {
    this._currentTrack = (this._currentTrack + 1) % this._tracks.length;
    this.start();
  }

  async start() {
    const track = this.currentTrack;
    const bitrate = await this.getBitrate(track);

    this._throttle = new Throttle(bitrate / 8);

    this.currentTrack.stream
      .pipe(this._throttle)
      .on('data', (chunk) => {
        this._stream.write(chunk);
      })
      .on('end', () => {
        this.next();
      })
      .on('error', () => {
        this.next();
      });
  }

  async loadTracksFromFolder(path: string) {
    const tracks = globSync(`${path}/**/*.mp3`);

    for (const track of tracks) {
      this.addTrack({
        id: v4(),
        path: track
      });
    }
  }

  get currentTrack() {
    return {
      ...this._tracks[this._currentTrack],
      stream: createReadStream(this._tracks[this._currentTrack].path)
    };
  }

  get tracks() {
    return this._tracks;
  }
}

export default Queue;
