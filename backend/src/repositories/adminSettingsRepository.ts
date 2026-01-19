/**
 * Admin Settings Repository Interface and Implementation
 * Abstracts database operations for admin settings and preferences
 */

import { AdminSettings, DisplayPreferences, CalendarView } from '../../../shared/types';
import { db } from '../database/init';
import { DatabaseError } from '../utils/errorHandler';

/**
 * Admin Settings Repository Interface
 * Defines the contract for admin settings data access
 */
export interface IAdminSettingsRepository {
  getAllSettings(): Promise<Record<string, string>>;
  getSetting(key: string): Promise<string | null>;
  updateSetting(key: string, value: string): Promise<boolean>;
  updateSettings(settings: Record<string, string>): Promise<number>;
  getDisplayPreferences(): Promise<DisplayPreferences>;
  updateDisplayPreferences(preferences: DisplayPreferences): Promise<number>;
}

/**
 * SQLite Implementation of Admin Settings Repository
 * Concrete implementation using SQLite database
 */
export class SQLiteAdminSettingsRepository implements IAdminSettingsRepository {

  async getAllSettings(): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT key, value FROM admin_settings WHERE key NOT LIKE "%token%" AND key NOT LIKE "%secret%"';
      
      db.all(query, [], (err, rows: { key: string; value: string }[]) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch admin settings', err));
        }
        
        const settings: Record<string, string> = {};
        rows.forEach(row => {
          settings[row.key] = row.value;
        });
        
        resolve(settings);
      });
    });
  }

  async getSetting(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT value FROM admin_settings WHERE key = ?';
      
      db.get(query, [key], (err, row: { value: string } | null) => {
        if (err) {
          reject(new DatabaseError(`Failed to fetch setting ${key}`, err));
        }
        
        resolve(row?.value || null);
      });
    });
  }

  async updateSetting(key: string, value: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO admin_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [key, value], (err) => {
        if (err) {
          reject(new DatabaseError(`Failed to update setting ${key}`, err));
        }
        resolve(true);
      });
    });
  }

  async updateSettings(settings: Record<string, string>): Promise<number> {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(settings);
      if (keys.length === 0) {
        resolve(0);
        return;
      }

      const placeholders = keys.map(() => '(?, ?, CURRENT_TIMESTAMP)').join(', ');
      const flatValues = keys.flatMap(key => [key, settings[key]]);
      
      const query = `
        INSERT OR REPLACE INTO admin_settings (key, value, updated_at)
        VALUES ${placeholders}
      `;

      db.run(query, flatValues, function(err) {
        if (err) {
          reject(new DatabaseError('Failed to update settings', err));
        }
        resolve(this.changes);
      });
    });
  }

  async getDisplayPreferences(): Promise<DisplayPreferences> {
    return new Promise((resolve, reject) => {
      const keys = ['defaultView', 'daysToShow', 'startHour', 'endHour', 'showWeekends'];
      const query = `SELECT key, value FROM admin_settings WHERE key IN (${keys.map(() => '?').join(',')})`;
      
      db.all(query, keys, (err, rows: { key: string; value: string }[]) => {
        if (err) {
          reject(new DatabaseError('Failed to fetch display preferences', err));
        }
        
        // Default preferences
        const defaultPrefs: DisplayPreferences = {
          defaultView: 'week',
          daysToShow: 7,
          startHour: 7,
          endHour: 20,
          showWeekends: true
        };

        // Override with stored values
        const preferences: DisplayPreferences = { ...defaultPrefs };
        rows.forEach(row => {
          const key = row.key as keyof DisplayPreferences;
          if (key === 'defaultView') {
            preferences[key] = row.value as CalendarView;
          } else if (key === 'showWeekends') {
            preferences[key] = row.value === 'true';
          } else {
            preferences[key] = parseInt(row.value) || defaultPrefs[key];
          }
        });
        
        resolve(preferences);
      });
    });
  }

  async updateDisplayPreferences(preferences: DisplayPreferences): Promise<number> {
    return new Promise((resolve, reject) => {
      const updates = Object.entries(preferences);
      if (updates.length === 0) {
        resolve(0);
        return;
      }

      // Use Promise.all to handle all updates
      const updatePromises = updates.map(([key, value]) => {
        return new Promise<void>((resolveUpdate, rejectUpdate) => {
          const query = `
            INSERT OR REPLACE INTO admin_settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `;
          
          db.run(query, [key, String(value)], (err) => {
            if (err) {
              rejectUpdate(new DatabaseError(`Failed to update preference ${key}`, err));
            } else {
              resolveUpdate();
            }
          });
        });
      });

      Promise.all(updatePromises)
        .then(() => resolve(updates.length))
        .catch(err => reject(err));
    });
  }
}