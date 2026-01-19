/**
 * Event Repository Interface and Implementation
 * Abstracts database operations for event-related data
 */

import { CalendarEvent } from '../../../shared/types';
import { db } from '../database/init';
import { DatabaseError, NotFoundError } from '../utils/errorHandler';

/**
 * Event Repository Interface
 * Defines the contract for event data access
 */
export interface IEventRepository {
  getEventsByCalendarId(calendarId: string): Promise<CalendarEvent[]>;
  getEventsByDateRange(startDate: string, endDate: string, calendarId?: string): Promise<CalendarEvent[]>;
  getTodaysEvents(): Promise<CalendarEvent[]>;
  getEventById(id: string): Promise<CalendarEvent | null>;
  createEvent(event: Omit<CalendarEvent, 'created_at' | 'updated_at'>): Promise<CalendarEvent>;
  updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<boolean>;
  deleteEventsByCalendarId(calendarId: string): Promise<number>;
}

/**
 * SQLite Implementation of Event Repository
 * Concrete implementation using SQLite database
 */
export class SQLiteEventRepository implements IEventRepository {

  async getEventsByCalendarId(calendarId: string): Promise<CalendarEvent[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT e.*, c.name as calendar_name, c.color as calendar_color
        FROM events e
        JOIN calendars c ON e.calendar_id = c.id
        WHERE e.calendar_id = ? AND c.selected = 1
        ORDER BY e.start_time ASC
      `;

      db.all(query, [calendarId], (err, rows: any[]) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch events by calendar', err));
        }
        resolve(rows);
      });
    });
  }

  async getEventsByDateRange(startDate: string, endDate: string, calendarId?: string): Promise<CalendarEvent[]> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT e.*, c.name as calendar_name, c.color as calendar_color
        FROM events e
        JOIN calendars c ON e.calendar_id = c.id
        WHERE c.selected = 1
      `;
      const params: any[] = [];

      // Add calendar filter if provided
      if (calendarId) {
        query += ' AND e.calendar_id = ?';
        params.push(calendarId);
      }

      // Add date range filter
      query += ' AND e.end_time >= ? AND e.start_time <= ?';
      params.push(startDate, endDate);

      query += ' ORDER BY e.start_time ASC';

      db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch events by date range', err));
        }
        resolve(rows);
      });
    });
  }

  async getTodaysEvents(): Promise<CalendarEvent[]> {
    return new Promise((resolve, reject) => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const query = `
        SELECT e.*, c.name as calendar_name, c.color as calendar_color
        FROM events e
        JOIN calendars c ON e.calendar_id = c.id
        WHERE c.selected = 1
          AND e.start_time < ?
          AND e.end_time >= ?
        ORDER BY e.start_time ASC
      `;

      db.all(query, [endOfDay, startOfDay], (err, rows: any[]) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch today\'s events', err));
        }
        resolve(rows);
      });
    });
  }

  async getEventById(id: string): Promise<CalendarEvent | null> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM events WHERE id = ?';

      db.get(query, [id], (err, row: CalendarEvent | null) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch event', err));
        }
        resolve(row);
      });
    });
  }

  async createEvent(event: Omit<CalendarEvent, 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
    return new Promise((resolve, reject) => {
      // First verify the calendar exists
      const calendarCheckQuery = 'SELECT id FROM calendars WHERE id = ?';
      db.get(calendarCheckQuery, [event.calendar_id], (checkErr, calendar) => {
        if (checkErr) {
          reject(new DatabaseError('Failed to verify calendar', checkErr));
          return;
        }

        if (!calendar) {
          reject(new NotFoundError('Calendar not found'));
          return;
        }

        // Insert the event
        const query = `
          INSERT INTO events (
            id, calendar_id, title, description, start_time, end_time, 
            all_day, location, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        const params = [
          event.id,
          event.calendar_id,
          event.title,
          event.description || null,
          event.start_time,
          event.end_time,
          event.all_day ? 1 : 0,
          event.location || null
        ];

        db.run(query, params, function(err) {
          if (err) {
            reject(new DatabaseError('Failed to create event', err));
          }
          
          // Fetch the newly created event
          const selectQuery = 'SELECT * FROM events WHERE id = ?';
          db.get(selectQuery, [event.id], (selectErr, createdEvent: CalendarEvent | null) => {
            if (selectErr) {
              reject(new DatabaseError('Failed to retrieve created event', selectErr));
            }
            if (!createdEvent) {
              reject(new DatabaseError('Event was not created'));
            }
            resolve(createdEvent as CalendarEvent);
          });
        });
      });
    });
  }

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return new Promise((resolve, reject) => {
      // Build dynamic update query
      const updateFields = [];
      const params: any[] = [];

      if (updates.title !== undefined) {
        updateFields.push('title = ?');
        params.push(updates.title);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        params.push(updates.description);
      }
      if (updates.start_time !== undefined) {
        updateFields.push('start_time = ?');
        params.push(updates.start_time);
      }
      if (updates.end_time !== undefined) {
        updateFields.push('end_time = ?');
        params.push(updates.end_time);
      }
      if (updates.all_day !== undefined) {
        updateFields.push('all_day = ?');
        params.push(updates.all_day ? 1 : 0);
      }
      if (updates.location !== undefined) {
        updateFields.push('location = ?');
        params.push(updates.location);
      }

      if (updateFields.length === 0) {
        this.getEventById(id).then(existingEvent => {
          if (existingEvent) {
            resolve(existingEvent);
          } else {
            reject(new NotFoundError('Event not found'));
          }
        }).catch(err => reject(err));
        return;
      }

      params.push(id);
      const query = `
        UPDATE events
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(query, params, function(err) {
        if (err) {
          reject(new DatabaseError('Failed to update event', err));
        }
        
        if (this.changes === 0) {
          reject(new NotFoundError('Event not found'));
        }
        
        // Fetch the updated event
        const selectQuery = 'SELECT * FROM events WHERE id = ?';
        db.get(selectQuery, [id], (selectErr, updatedEvent: CalendarEvent | null) => {
          if (selectErr) {
            reject(new DatabaseError('Failed to retrieve updated event', selectErr));
          }
          if (!updatedEvent) {
            reject(new NotFoundError('Event not found after update'));
          }
          resolve(updatedEvent as CalendarEvent);
        });
      });
    });
  }

  async deleteEvent(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM events WHERE id = ?';

      db.run(query, [id], function(err) {
        if (err) {
          reject(new DatabaseError('Failed to delete event', err));
        }
        
        resolve(this.changes > 0);
      });
    });
  }

  async deleteEventsByCalendarId(calendarId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM events WHERE calendar_id = ?';

      db.run(query, [calendarId], function(err) {
        if (err) {
          reject(new DatabaseError('Failed to delete events by calendar', err));
        }
        
        resolve(this.changes);
      });
    });
  }
}