import { google } from 'googleapis';
import { db } from '../database/init';
import { Calendar, CalendarEvent } from '../../../shared/types';

export class GoogleCalendarService {
  private oauth2Client: any;
  // Promise that resolves when credentials have been loaded/set at least once
  public ready: Promise<void>;
  private _readyResolve!: () => void;
  private _readyReject!: (err?: any) => void;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // create the ready promise and start background waiting for credentials
    this.ready = new Promise<void>((resolve, reject) => {
      this._readyResolve = resolve;
      this._readyReject = reject;
    });

    // Start polling for credentials in the background (non-blocking constructor)
    this.waitForCredentials().then(() => {
      // resolved inside waitForCredentials when setCredentials succeeds
    }).catch(err => {
      console.error('❌ Error while waiting for Google credentials:', err);
      // reject the ready promise so awaiters know something went wrong
      this._readyReject(err);
    });
  }

  // Set access token from stored credentials
  async setCredentials(): Promise<boolean> {
    return new Promise((resolve) => {
      db.get('SELECT value FROM admin_settings WHERE key = ?', ['google_access_token'], (err, row: any) => {
        if (err || !row) {
          console.error('❌ No Google access token found');
          resolve(false);
          return;
        }

        // Get refresh token as well
        db.get('SELECT value FROM admin_settings WHERE key = ?', ['google_refresh_token'], (refreshErr, refreshRow: any) => {
          this.oauth2Client.setCredentials({
            access_token: row.value,
            refresh_token: refreshRow?.value
          });

          // Set up automatic token refresh
          this.oauth2Client.on('tokens', (tokens: any) => {
            if (tokens.access_token) {
              this.storeToken('google_access_token', tokens.access_token);
            }
            if (tokens.refresh_token) {
              this.storeToken('google_refresh_token', tokens.refresh_token);
            }
          });

          resolve(true);
        });
      });
    });
  }

  // New: poll DB until credentials exist, then set them and resolve ready
  async waitForCredentials(intervalMs = 5000, timeoutMs?: number): Promise<void> {
    const start = Date.now();

    const checkOnce = (): Promise<boolean> => {
      return new Promise((resolve) => {
        db.get('SELECT value FROM admin_settings WHERE key = ?', ['google_refresh_token'], (err, row: any) => {
          if (!err && row && row.value) {
            resolve(true);
            return;
          }
          // fallback to access token existence
          db.get('SELECT value FROM admin_settings WHERE key = ?', ['google_access_token'], (aErr, aRow: any) => {
            if (!aErr && aRow && aRow.value) {
              resolve(true);
            } else {
              resolve(false);
            }
          });
        });
      });
    };

    const loop = async (): Promise<void> => {
      while (true) {
        const has = await checkOnce();
        if (has) {
          // try to set credentials from DB now
          const ok = await this.setCredentials();
          if (ok) {
            // resolve the ready promise once credentials have been set
            try { this._readyResolve(); } catch {}
            return;
          }
        }

        if (timeoutMs && Date.now() - start >= timeoutMs) {
          throw new Error('Timed out waiting for Google credentials');
        }

        // wait before next check
        await new Promise(res => setTimeout(res, intervalMs));
      }
    };

    return loop();
  }

  // Helper that consumers can await with optional timeout
  async ensureCredentialsAvailable(timeoutMs?: number): Promise<void> {
    if (timeoutMs == null) {
      return this.ready;
    }

    return Promise.race([
      this.ready,
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for Google credentials')), timeoutMs))
    ]);
  }

  // Store token in database
  private storeToken(key: string, value: string): void {
    db.run(
      'INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [key, value],
      (err) => {
        if (err) {
          console.error(`❌ Error storing ${key}:`, err);
        }
      }
    );
  }

  // Fetch user's calendar list from Google
  async fetchCalendarList(): Promise<Calendar[]> {
    const hasCredentials = await this.setCredentials();
    if (!hasCredentials) {
      throw new Error('No Google credentials available');
    }

    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const response = await calendar.calendarList.list();

      const googleCalendars = response.data.items || [];
      const calendars: Calendar[] = googleCalendars.map(cal => ({
        id: cal.id!,
        name: cal.summary || 'Unnamed Calendar',
        description: cal.description || '',
        color: cal.backgroundColor || '#3B82F6',
        selected: false, // Default to not selected
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      return calendars;
    } catch (error: any) {
      console.error('❌ Error fetching calendar list:', error);
      throw new Error(`Failed to fetch calendar list: ${error.message}`);
    }
  }

  // Sync calendar list to local database
  async syncCalendarList(): Promise<{ imported: number; updated: number }> {
    const calendars = await this.fetchCalendarList();
    let imported = 0;
    let updated = 0;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO calendars (id, name, description, color, selected, updated_at)
          VALUES (?, ?, ?, ?, 
            COALESCE((SELECT selected FROM calendars WHERE id = ?), 0),
            CURRENT_TIMESTAMP)
        `);

        calendars.forEach(calendar => {
          stmt.run([
            calendar.id,
            calendar.name,
            calendar.description,
            calendar.color,
            calendar.id // For the COALESCE to preserve existing selection
          ], function(err) {
            if (err) {
              console.error('❌ Error syncing calendar:', calendar.name, err);
            } else {
              if (this.changes > 0) {
                // Check if this was an insert or update
                db.get('SELECT COUNT(*) as count FROM calendars WHERE id = ? AND created_at < updated_at', 
                  [calendar.id], (countErr, countRow: any) => {
                    if (!countErr && countRow?.count > 0) {
                      updated++;
                    } else {
                      imported++;
                    }
                  });
              }
            }
          });
        });

        stmt.finalize((err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ Synced ${calendars.length} calendars (${imported} new, ${updated} updated)`);
            resolve({ imported, updated });
          }
        });
      });
    });
  }

  // Fetch events from a specific calendar
  async fetchCalendarEvents(calendarId: string, timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    const hasCredentials = await this.setCredentials();
    if (!hasCredentials) {
      throw new Error('No Google credentials available');
    }

    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      // Default to next 30 days if no time range specified
      const now = new Date();
      const defaultTimeMin = timeMin || now.toISOString();
      const defaultTimeMax = timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: defaultTimeMin,
        timeMax: defaultTimeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250
      });

      const googleEvents = response.data.items || [];
      const events: CalendarEvent[] = googleEvents.map(event => {
        const startTime = event.start?.dateTime || event.start?.date || new Date().toISOString();
        const endTime = event.end?.dateTime || event.end?.date || new Date().toISOString();
        const allDay = !event.start?.dateTime; // If no dateTime, it's an all-day event

        return {
          id: event.id!,
          calendar_id: calendarId,
          title: event.summary || 'Untitled Event',
          description: event.description || '',
          start_time: startTime,
          end_time: endTime,
          all_day: allDay,
          location: event.location || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      return events;
    } catch (error: any) {
      console.error(`❌ Error fetching events for calendar ${calendarId}:`, error);
      throw new Error(`Failed to fetch events: ${error.message}`);
    }
  }

  // Sync events for all selected calendars
  async syncSelectedCalendarEvents(): Promise<{ calendars: number; events: number; errors: string[] }> {
    return new Promise((resolve, reject) => {
      // Get all selected calendars
      db.all('SELECT * FROM calendars WHERE selected = 1', [], async (err, calendars: Calendar[]) => {
        if (err) {
          reject(err);
          return;
        }

        if (calendars.length === 0) {
          resolve({ calendars: 0, events: 0, errors: ['No calendars selected for sync'] });
          return;
        }

        let totalEvents = 0;
        const errors: string[] = [];

        // Clear existing events for selected calendars
        const calendarIds = calendars.map(cal => cal.id);
        const placeholders = calendarIds.map(() => '?').join(',');
        
        db.run(`DELETE FROM events WHERE calendar_id IN (${placeholders})`, calendarIds, (deleteErr) => {
          if (deleteErr) {
            console.error('❌ Error clearing existing events:', deleteErr);
            errors.push('Failed to clear existing events');
          }

          // Sync events for each selected calendar
          const syncPromises = calendars.map(async (calendar) => {
            try {
              const events = await this.fetchCalendarEvents(calendar.id);
              
              // Insert events into database
              return new Promise<number>((resolveEvents, rejectEvents) => {
                if (events.length === 0) {
                  resolveEvents(0);
                  return;
                }

                const stmt = db.prepare(`
                  INSERT INTO events (id, calendar_id, title, description, start_time, end_time, all_day, location, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `);

                let insertedCount = 0;
                events.forEach(event => {
                  stmt.run([
                    event.id,
                    event.calendar_id,
                    event.title,
                    event.description,
                    event.start_time,
                    event.end_time,
                    event.all_day ? 1 : 0,
                    event.location
                  ], function(insertErr) {
                    if (insertErr) {
                      console.error(`❌ Error inserting event ${event.title}:`, insertErr);
                    } else {
                      insertedCount++;
                    }
                  });
                });

                stmt.finalize((finalizeErr) => {
                  if (finalizeErr) {
                    rejectEvents(finalizeErr);
                  } else {
                    console.log(`✅ Synced ${insertedCount} events for calendar: ${calendar.name}`);
                    resolveEvents(insertedCount);
                  }
                });
              });
            } catch (error: any) {
              console.error(`❌ Error syncing calendar ${calendar.name}:`, error);
              errors.push(`Failed to sync calendar "${calendar.name}": ${error.message}`);
              return 0;
            }
          });

          Promise.all(syncPromises)
            .then(eventCounts => {
              totalEvents = eventCounts.reduce((sum, count) => sum + count, 0);
              resolve({
                calendars: calendars.length,
                events: totalEvents,
                errors
              });
            })
            .catch(syncError => {
              reject(syncError);
            });
        });
      });
    });
  }

  // Test Google Calendar API connection
  async testConnection(): Promise<{ success: boolean; message: string; userEmail?: string }> {
    const hasCredentials = await this.setCredentials();
    if (!hasCredentials) {
      return {
        success: false,
        message: 'No Google credentials available. Please authenticate first.'
      };
    }

    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      // Try to get calendar list as a simple test
      const response = await calendar.calendarList.list({ maxResults: 1 });
      
      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      return {
        success: true,
        message: 'Google Calendar API connection successful',
        userEmail: userInfo.data.email ?? undefined
      };
    } catch (error: any) {
      console.error('❌ Google Calendar API test failed:', error);
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();