/**
 * Sync Log Repository Interface and Implementation
 * Abstracts database operations for sync log data
 */

import { SyncLog } from '../../../shared/types';
import { db } from '../database/init';
import { DatabaseError } from '../utils/errorHandler';

/**
 * Sync Log Repository Interface
 * Defines the contract for sync log data access
 */
export interface ISyncLogRepository {
  createLog(status: string, message: string, eventsSynced?: number): Promise<SyncLog>;
  updateLog(id: number, status: string, message: string, eventsSynced?: number): Promise<boolean>;
  getLogs(limit: number): Promise<SyncLog[]>;
  getLogById(id: number): Promise<SyncLog | null>;
}

/**
 * SQLite Implementation of Sync Log Repository
 * Concrete implementation using SQLite database
 */
export class SQLiteSyncLogRepository implements ISyncLogRepository {

  async createLog(status: string, message: string, eventsSynced: number = 0): Promise<SyncLog> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO sync_log (status, message, events_synced, started_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;

      db.run(query, [status, message, eventsSynced], function(err) {
        if (err) {
          reject(new DatabaseError('Failed to create sync log', err));
        }
        
        // Fetch the newly created log
        const selectQuery = 'SELECT * FROM sync_log WHERE id = ?';
        db.get(selectQuery, [this.lastID], (selectErr, log: SyncLog | null) => {
          if (selectErr) {
            reject(new DatabaseError('Failed to retrieve created sync log', selectErr));
          }
          if (!log) {
            reject(new DatabaseError('Sync log was not created'));
          }
          resolve(log as SyncLog);
        });
      });
    });
  }

  async updateLog(id: number, status: string, message: string, eventsSynced?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE sync_log
        SET status = ?,
            message = ?,
            events_synced = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const params = [status, message, eventsSynced || 0, id];

      db.run(query, params, function(err) {
        if (err) {
          reject(new DatabaseError('Failed to update sync log', err));
        }
        
        resolve(this.changes > 0);
      });
    });
  }

  async getLogs(limit: number): Promise<SyncLog[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM sync_log 
        ORDER BY started_at DESC 
        LIMIT ?
      `;

      db.all(query, [limit], (err, rows: SyncLog[]) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch sync logs', err));
        }
        resolve(rows);
      });
    });
  }

  async getLogById(id: number): Promise<SyncLog | null> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM sync_log WHERE id = ?';

      db.get(query, [id], (err, row: SyncLog | null) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch sync log', err));
        }
        resolve(row);
      });
    });
  }
}