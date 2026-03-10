import Fastify from 'fastify';
import cors from '@fastify/cors';
import './db/index.js'; // init DB on startup
import { roomRoutes } from './routes/rooms.js';
import { searchRoutes } from './routes/search.js';
import { rewardsRoutes } from './routes/rewards.js';
import { setupSocketIO } from './socket/index.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const app = Fastify({
    logger: { level: 'info' },
  });

  await app.register(cors, { origin: true });

  // Register routes
  await app.register(roomRoutes);
  await app.register(searchRoutes);
  await app.register(rewardsRoutes);

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: Date.now() }));

  // Start Fastify first to get the http server
  await app.listen({ port: PORT, host: HOST });

  // Attach Socket.io to Fastify's underlying http server
  const io = setupSocketIO(app.server);

  console.log(`\n  soound server running on http://${HOST}:${PORT}\n`);

  // Graceful shutdown
  const shutdown = () => {
    io.close();
    app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
