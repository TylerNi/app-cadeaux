import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { dataDir } from './config.js';

mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'app.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(readFileSync(path.join(import.meta.dirname, 'schema.sql'), 'utf8'));
