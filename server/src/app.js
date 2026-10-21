import cors from 'cors';
import express from 'express';
import { allowedClientOrigins } from './origins.js';
import apiRouter from './routes/api.js';

export function createApp() {
  const app = express();
  const origins = allowedClientOrigins();
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.has(origin)) return callback(null, true);
        return callback(new Error('This browser origin is not allowed.'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', apiRouter);
  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: error.message || 'Something went wrong.' });
  });
  return app;
}
