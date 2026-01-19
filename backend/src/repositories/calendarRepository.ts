/**
 * Calendar Repository Interface and Implementation
 * Abstracts database operations for calendar-related data
 */

import { Calendar } from '../../../shared/types';
import { db } from '../database/init';
import { DatabaseError, NotFoundError } from '../utils/errorHandler';

/**
 * Calendar Repository Interface
 * Defines the contract for calendar data access
 */
export interface ICalendarRepository {
  getAllCalendars(): Promise<Calendar[]>;
  getSelectedCalendars(): Promise<Calendar[]>;
  getCalendarById(id: string): Promise<Calendar | null>;
  createCalendar(calendar: Omit<Calendar, 'created_at' | 'updated_at'>): Promise<Calendar>;
  updateCalendar(id: string, updates: Partial<Calendar>): Promise<Calendar>;
  toggleCalendarSelection(id: string): Promise<void>;
  deleteCalendar(id: string): Promise<boolean>;
}

/**
 * SQLite Implementation of Calendar Repository
 * Concrete implementation using SQLite database
 */
export class SQLiteCalendarRepository implements ICalendarRepository {
  
  async getAllCalendars(): Promise<Calendar[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM calendars ORDER BY name';
      db.all(query, [], (err, rows: Calendar[]) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch calendars', err));
        }
        resolve(rows);
      });
    });
  }

  async getSelectedCalendars(): Promise<Calendar[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM calendars WHERE selected = 1 ORDER BY name ASC';
      db.all(query, [], (err, rows: Calendar[]) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch selected calendars', err));
        }
        resolve(rows);
      });
    });
  }

  async getCalendarById(id: string): Promise<Calendar | null> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM calendars WHERE id = ?';
      db.get(query, [id], (err, row: Calendar | null) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch calendar', err));
        }
        resolve(row);
      });
    });
  }

  async createCalendar(calendar: Omit<Calendar, 'created_at' | 'updated_at'>): Promise<Calendar> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO calendars (id, name, description, color, selected, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const params = [
        calendar.id,
        calendar.name,
        calendar.description || null,
        calendar.color || '#3B82F6',
        calendar.selected ? 1 : 0
      ];

      db.run(query, params, function(err) {
        if (err) {
          reject(new DatabaseError('Failed to create calendar', err));
        }
        
        // Fetch the newly created calendar
        const selectQuery = 'SELECT * FROM calendars WHERE id = ?';
        db.get(selectQuery, [calendar.id], (selectErr, createdCalendar: Calendar | null) => {
          if (selectErr) {
            reject(new DatabaseError('Failed to retrieve created calendar', selectErr));
          }
          if (!createdCalendar) {
            reject(new DatabaseError('Calendar was not created'));
          }
          resolve(createdCalendar as Calendar);
        });
      });
    });
  }

  async updateCalendar(id: string, updates: Partial<Calendar>): Promise<Calendar> {
    return new Promise((resolve, reject) => {
      // Build dynamic update query
      const updateFields = [];
      const params: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        params.push(updates.name);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        params.push(updates.description);
      }
      if (updates.color !== undefined) {
        updateFields.push('color = ?');
        params.push(updates.color);
      }
      if (updates.selected !== undefined) {
        updateFields.push('selected = ?');
        params.push(updates.selected ? 1 : 0);
      }

      if (updateFields.length === 0) {
        this.getCalendarById(id).then(existingCalendar => {
          if (existingCalendar) {
            resolve(existingCalendar);
          } else {
            reject(new NotFoundError('Calendar not found'));
          }
        }).catch(err => reject(err));
        return;
      }

      params.push(id);
      const query = `
        UPDATE calendars
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(query, params, function(err) {
        if (err) {
          reject(new DatabaseError('Failed to update calendar', err));
        }
        
        if (this.changes === 0) {
          reject(new NotFoundError('Calendar not found'));
        }
        
        // Fetch the updated calendar
        const selectQuery = 'SELECT * FROM calendars WHERE id = ?';
        db.get(selectQuery, [id], (selectErr, updatedCalendar: Calendar | null) => {
          if (selectErr) {
            reject(new DatabaseError('Failed to retrieve updated calendar', selectErr));
          }
          if (!updatedCalendar) {
            reject(new NotFoundError('Calendar not found after update'));
          }
          resolve(updatedCalendar as Calendar);
        });
      });
    });
  }

  async toggleCalendarSelection(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE calendars 
        SET selected = CASE WHEN selected = 1 THEN 0 ELSE 1 END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(query, [id], function(err) {
        if (err) {
          reject(new DatabaseError('Failed to toggle calendar selection', err));
        }
        
        if (this.changes === 0) {
          reject(new NotFoundError('Calendar not found'));
        }
        
        resolve();
      });
    });
  }

  async deleteCalendar(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM calendars WHERE id = ?';

      db.run(query, [id], function(err) {
        if (err) {
          reject(new DatabaseError('Failed to delete calendar', err));
        }
        
        resolve(this.changes > 0);
      });
    });
  }
}