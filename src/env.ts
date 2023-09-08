import { configDotenv } from 'dotenv';
import { cleanEnv, str } from 'envalid';

// Load .env file
configDotenv();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development'
  }),
  STREAM_KEY: str({
    default: ''
  }),
  STREAM_URL: str({
    default: 'rtmp://localhost/live/test'
  })
});

export type Env = typeof env;
