import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use /app/data in production (Railway volume), local path in dev
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'soound.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

initSchema(db);

export default db;
