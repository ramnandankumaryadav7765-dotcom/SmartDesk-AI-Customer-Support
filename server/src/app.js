import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'node:url';
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
  if (process.env.NODE_ENV === 'production') {
    const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
    app.use(express.static(clientDist));
    app.use((request, response, next) => {
      if (request.method !== 'GET' || request.path.startsWith('/api')) return next();
      return response.sendFile(fileURLToPath(new URL('../../client/dist/index.html', import.meta.url)));
    });
  }
  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: error.message || 'Something went wrong.' });
  });
  return app;
}
