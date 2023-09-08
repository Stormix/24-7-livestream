# 24/7 Livestream

A tool to create a 24/7 livestream from a given list of videos and audio files. The tool will automatically loop the videos and audio files to create a seamless livestream. Similar to [24/7 lofi hip hop radio](https://www.youtube.com/watch?v=jfKfPfyJRdk).


## Installation

### Requirements

- [FFmpeg](https://ffmpeg.org/download.html)
- [Node.js](https://nodejs.org/en/download/)

### Install

```bash
pnpm install
```

## Usage

### Configuration

The configuration is done in the `.env` file. The following variables are available:
| Variable | Description | Default |
| --- | --- | --- |
| `STREAM_KEY` | The stream key of the livestream. | `''` |
| `STREAM_URL` | The URL of the livestream. | `rtmp://localhost/live` |
| `VIDEO_DIRECTORY` | The directory where the videos are located. | `./videos` |
| `AUDIO_DIRECTORY` | The directory where the audio files are located. | `./audio` |

### Start

```bash
pnpm start
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

## Docker
  
```bash 
docker build -t 24-7-livestream .
docker run -d 24-7-livestream
```
