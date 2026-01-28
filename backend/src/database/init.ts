import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

const DB_PATH = path.join(__dirname, '../../db/calendar.db');

// Ensure db directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new sqlite3.Database(DB_PATH);

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create calendars table
      db.run(`
        CREATE TABLE IF NOT EXISTS calendars (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          color TEXT,
          selected BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create events table
      db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          calendar_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          all_day BOOLEAN DEFAULT 0,
          location TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (calendar_id) REFERENCES calendars (id)
        )
      `);

      // Create admin_settings table for OAuth tokens and app configuration
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create sync_log table to track sync operations
      db.run(`
        CREATE TABLE IF NOT EXISTS sync_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          status TEXT NOT NULL,
          message TEXT,
          events_synced INTEGER DEFAULT 0,
          started_at DATETIME NOT NULL,
          completed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          logger.error('❌ Database initialization error:', err);
          reject(err);
        } else {
          logger.info('✅ Database tables created/verified');
          resolve();
        }
      });
    });
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      logger.error('❌ Error closing database:', err);
    } else {
      logger.info('✅ Database connection closed');
    }
    process.exit(0);
  });
});
