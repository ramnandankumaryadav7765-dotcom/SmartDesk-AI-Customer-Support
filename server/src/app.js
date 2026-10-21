import cors from 'cors';
import express from 'express';
import apiRouter from './routes/api.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', apiRouter);
  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: error.message || 'Something went wrong.' });
  });
  return app;
}
