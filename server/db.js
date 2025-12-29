const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'files.db');
const db = new Database(dbPath);

/* Schema Definition */
db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, /* 'file' or 'directory' */
    size INTEGER,
    mtime DATETIME,
    birthtime DATETIME,
    owner TEXT,
    permissions TEXT,
    parent_path TEXT,
    summary TEXT,
    tags TEXT,
    importance TEXT DEFAULT 'normal',
    last_scanned DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_path ON files(path);
  CREATE INDEX IF NOT EXISTS idx_parent ON files(parent_path);
`);

/* Migration: Add columns if they don't exist */
try {
  db.exec(`ALTER TABLE files ADD COLUMN tags TEXT;`);
} catch (e) { /* Column likely exists */ }

try {
  db.exec(`ALTER TABLE files ADD COLUMN importance TEXT DEFAULT 'normal';`);
} catch (e) { /* Column likely exists */ }

module.exports = db;
