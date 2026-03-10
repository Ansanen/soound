import { FastifyInstance } from 'fastify';
import db from '../db/index.js';

export async function rewardsRoutes(app: FastifyInstance) {
  // Update listening time and calculate points
  app.post('/api/rewards/:userId/listen', async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const { minutes, roomSize } = req.body as { minutes: number; roomSize: number };

    const multiplier = Math.max(1, roomSize);
    const points = minutes * multiplier;

    db.prepare(`
      UPDATE rewards
      SET minutes_listened = minutes_listened + ?,
          total_points = total_points + ?
      WHERE user_id = ?
    `).run(minutes, points, userId);

    const rewards = db.prepare('SELECT * FROM rewards WHERE user_id = ?').get(userId);
    return rewards;
  });

  // Increment friends invited
  app.post('/api/rewards/:userId/invite', async (req, reply) => {
    const { userId } = req.params as { userId: string };
    db.prepare('UPDATE rewards SET friends_invited = friends_invited + 1, total_points = total_points + 50 WHERE user_id = ?').run(userId);
    const rewards = db.prepare('SELECT * FROM rewards WHERE user_id = ?').get(userId);
    return rewards;
  });
}
