import dotenv from 'dotenv';
import { cleanEnv, num, port, str } from 'envalid';

dotenv.config();

// Load .env file
export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development'
  }),
  STREAM_KEY: str(),
  STREAM_URL: str(),
  PORT: port({
    default: 6969
  }),
  VIDEO_DIRECTORY: str({
    default: './assets/videos'
  }),
  AUDIO_DIRECTORY: str({
    default: './assets/audio'
  }),
  RETRIES: num({
    default: 3
  }),
  DATABASE_URL: str()
});

export type Env = typeof env;
