import 'dotenv/config';
import { createApp } from './app.js';
import { closeStore, connectStore } from './store.js';

const port = Number(process.env.PORT || 4000);
await connectStore();

const server = createApp().listen(port, () => {
  console.log(`SmartDesk API ready at http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  server.close();
  await closeStore();
  process.exit(0);
});
