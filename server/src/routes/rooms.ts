import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export async function roomRoutes(app: FastifyInstance) {
  // Create user
  app.post('/api/users', async (req, reply) => {
    const { username } = req.body as { username: string };
    if (!username?.trim()) {
      return reply.status(400).send({ error: 'Username is required' });
    }
    const id = uuid();
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run(id, username.trim());
    db.prepare('INSERT INTO rewards (user_id) VALUES (?)').run(id);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return user;
  });

  // Create room
  app.post('/api/rooms', async (req, reply) => {
    const { name, hostId } = req.body as { name: string; hostId: string };
    if (!name?.trim() || !hostId) {
      return reply.status(400).send({ error: 'Name and hostId are required' });
    }
    const id = uuid();
    const code = generateCode();
    db.prepare('INSERT INTO rooms (id, code, name, host_id) VALUES (?, ?, ?, ?)').run(id, code, name.trim(), hostId);
    db.prepare('INSERT INTO room_participants (room_id, user_id) VALUES (?, ?)').run(id, hostId);

    // Increment rooms_hosted
    db.prepare('UPDATE rewards SET rooms_hosted = rooms_hosted + 1 WHERE user_id = ?').run(hostId);

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
    return room;
  });

  // Get room by code
  app.get('/api/rooms/:code', async (req, reply) => {
    const { code } = req.params as { code: string };
    const room = db.prepare('SELECT * FROM rooms WHERE code = ? AND is_active = 1').get(code);
    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }
    const participants = db.prepare(`
      SELECT u.* FROM users u
      JOIN room_participants rp ON rp.user_id = u.id
      WHERE rp.room_id = ?
    `).all((room as any).id);
    return { ...(room as any), participants };
  });

  // Get room queue
  app.get('/api/rooms/:code/queue', async (req, reply) => {
    const { code } = req.params as { code: string };
    const room = db.prepare('SELECT id FROM rooms WHERE code = ?').get(code) as any;
    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }
    const queue = db.prepare('SELECT * FROM queue WHERE room_id = ? ORDER BY position ASC').all(room.id);
    return queue;
  });

  // Add track to queue
  app.post('/api/rooms/:code/queue', async (req, reply) => {
    const { code } = req.params as { code: string };
    const { youtubeId, title, artist, duration, addedBy } = req.body as {
      youtubeId: string; title: string; artist: string; duration: number; addedBy: string;
    };
    const room = db.prepare('SELECT id FROM rooms WHERE code = ?').get(code) as any;
    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }
    const lastPos = db.prepare('SELECT MAX(position) as maxPos FROM queue WHERE room_id = ?').get(room.id) as any;
    const position = (lastPos?.maxPos ?? -1) + 1;
    const id = uuid();
    db.prepare(
      'INSERT INTO queue (id, room_id, youtube_id, title, artist, duration, added_by, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, room.id, youtubeId, title, artist || '', duration || 0, addedBy, position);
    const track = db.prepare('SELECT * FROM queue WHERE id = ?').get(id);
    return track;
  });

  // Get rewards
  app.get('/api/rewards/:userId', async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const rewards = db.prepare('SELECT * FROM rewards WHERE user_id = ?').get(userId);
    if (!rewards) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return rewards;
  });
}
