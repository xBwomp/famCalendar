import { Router, Request, Response } from 'express';
import { requireAuthAPI } from '../middleware/auth';
import { googleCalendarService } from '../services/googleCalendarService';
import { db } from '../database/init';
import { ApiResponse, SyncLog } from '../../../shared/types';

const router = Router();

// POST /api/sync/test-connection - Test Google Calendar API connection
router.post('/test-connection', requireAuthAPI, async (req: Request, res: Response) => {
  try {
    const result = await googleCalendarService.testConnection();
    
    const response: ApiResponse = {
      success: result.success,
      data: result,
      message: result.message
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Error testing Google Calendar connection:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to test Google Calendar connection',
      message: error.message
    };
    res.status(500).json(response);
  }
});

// POST /api/sync/calendars - Sync calendar list from Google
router.post('/calendars', requireAuthAPI, async (req: Request, res: Response) => {
  try {
    const result = await googleCalendarService.syncCalendarList();
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: `Successfully synced calendars: ${result.imported} new, ${result.updated} updated`
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Error syncing calendars:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to sync calendars from Google',
      message: error.message
    };
    res.status(500).json(response);
  }
});

// POST /api/sync/events - Sync events from selected Google calendars
router.post('/events', requireAuthAPI, async (req: Request, res: Response) => {
  const syncStartTime = new Date().toISOString();
  
  // Log sync start
  db.run(
    'INSERT INTO sync_log (status, message, started_at) VALUES (?, ?, ?)',
    ['started', 'Starting event sync from Google Calendar', syncStartTime],
    function(err) {
      if (err) {
        console.error('❌ Error logging sync start:', err);
        res.status(500).json({ success: false, message: 'Error logging sync start' });
        return;
      }
    }
  );

  try {
    const result = await googleCalendarService.syncSelectedCalendarEvents();
    
    // Log sync completion
    db.run(
      'UPDATE sync_log SET status = ?, message = ?, events_synced = ?, completed_at = CURRENT_TIMESTAMP WHERE started_at = ?',
      [
        'completed',
        `Successfully synced ${result.events} events from ${result.calendars} calendars`,
        result.events,
        syncStartTime
      ],
      (updateErr) => {
        if (updateErr) {
          console.error('❌ Error updating sync log:', updateErr);
          res.status(500).json({ success: false, message: 'Error updating sync log' });
          return;
        }
      }
    );

    // Update last sync time in admin settings
    db.run(
      'INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      ['last_sync_time', new Date().toISOString()],
      (syncTimeErr) => {
        if (syncTimeErr) {
          console.error('❌ Error updating last sync time:', syncTimeErr);
        }
      }
    );

    const response: ApiResponse = {
      success: true,
      data: result,
      message: `Successfully synced ${result.events} events from ${result.calendars} calendars`
    };
    
    if (result.errors.length > 0) {
      response.message += `. Warnings: ${result.errors.join(', ')}`;
    }
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Error syncing events:', error);
    
    // Log sync failure
    db.run(
      'UPDATE sync_log SET status = ?, message = ?, completed_at = CURRENT_TIMESTAMP WHERE started_at = ?',
      ['failed', `Sync failed: ${error.message}`, syncStartTime],
      (updateErr) => {
        if (updateErr) {
          console.error('❌ Error updating sync log:', updateErr);
          res.status(500).json({ success: false, message: 'Error updating sync log' });
          return;
        }
      }
    );

    const response: ApiResponse = {
      success: false,
      error: 'Failed to sync events from Google Calendar',
      message: error.message
    };
    res.status(500).json(response);
  }
});

// POST /api/sync/full - Full sync (calendars + events)
router.post('/full', requireAuthAPI, async (req: Request, res: Response) => {
  const syncStartTime = new Date().toISOString();
  
  // Log sync start
  db.run(
    'INSERT INTO sync_log (status, message, started_at) VALUES (?, ?, ?)',
    ['started', 'Starting full sync from Google Calendar', syncStartTime]
  );

  try {
    // First sync calendars
    const calendarResult = await googleCalendarService.syncCalendarList();
    
    // Then sync events
    const eventResult = await googleCalendarService.syncSelectedCalendarEvents();
    
    const totalEvents = eventResult.events;
    const totalCalendars = calendarResult.imported + calendarResult.updated;
    
    // Log sync completion
    db.run(
      'UPDATE sync_log SET status = ?, message = ?, events_synced = ?, completed_at = CURRENT_TIMESTAMP WHERE started_at = ?',
      [
        'completed',
        `Full sync completed: ${totalCalendars} calendars, ${totalEvents} events`,
        totalEvents,
        syncStartTime
      ]
    );

    // Update last sync time in admin settings
    db.run(
      'INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      ['last_sync_time', new Date().toISOString()]
    );

    const response: ApiResponse = {
      success: true,
      data: {
        calendars: calendarResult,
        events: eventResult
      },
      message: `Full sync completed: ${totalCalendars} calendars synced, ${totalEvents} events synced`
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Error during full sync:', error);
    
    // Log sync failure
    db.run(
      'UPDATE sync_log SET status = ?, message = ?, completed_at = CURRENT_TIMESTAMP WHERE started_at = ?',
      ['failed', `Full sync failed: ${error.message}`, syncStartTime]
    );

    const response: ApiResponse = {
      success: false,
      error: 'Failed to perform full sync',
      message: error.message
    };
    res.status(500).json(response);
  }
});

// GET /api/sync/logs - Get sync history
router.get('/logs', requireAuthAPI, (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  
  const query = `
    SELECT * FROM sync_log 
    ORDER BY started_at DESC 
    LIMIT ?
  `;
  
  db.all(query, [parseInt(limit as string)], (err, rows: SyncLog[]) => {
    if (err) {
      console.error('❌ Error fetching sync logs:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch sync logs'
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse<SyncLog[]> = {
      success: true,
      data: rows,
      message: `Retrieved ${rows.length} sync log entries`
    };
    return res.json(response);
  });
});

export default router;