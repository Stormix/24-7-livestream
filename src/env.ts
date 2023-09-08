import { configDotenv } from 'dotenv';
import { cleanEnv, port, str } from 'envalid';

// Load .env file
configDotenv({ path: '.env.local' });

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development'
  }),
  STREAM_KEY: str({
    default: ''
  }),
  STREAM_URL: str({
    default: ''
  }),
  PORT: port({
    default: 6969
  }),
  VIDEO_DIRECTORY: str({
    default: './assets/videos'
  }),
  AUDIO_DIRECTORY: str({
    default: './assets/audio'
  })
});

export type Env = typeof env;
