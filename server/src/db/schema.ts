import Database from 'better-sqlite3';

export function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      host_id TEXT REFERENCES users(id),
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS room_participants (
      room_id TEXT REFERENCES rooms(id),
      user_id TEXT REFERENCES users(id),
      joined_at INTEGER DEFAULT (unixepoch()),
      PRIMARY KEY (room_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS queue (
      id TEXT PRIMARY KEY,
      room_id TEXT REFERENCES rooms(id),
      youtube_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      duration INTEGER,
      added_by TEXT REFERENCES users(id),
      position INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS rewards (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      minutes_listened INTEGER DEFAULT 0,
      rooms_hosted INTEGER DEFAULT 0,
      friends_invited INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0
    );
  `);
}
