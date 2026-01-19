import { Router, Request, Response } from 'express';
import { requireAuthAPI } from '../middleware/auth';
import { googleCalendarService } from '../services/googleCalendarService';
import { ApiResponse, SyncLog } from '../../../shared/types';
import { handleAsync, apiResponse, DatabaseError, ApiError } from '../utils/errorHandler';
import { SQLiteSyncLogRepository, ISyncLogRepository } from '../repositories/syncLogRepository';

const router = Router();

// Initialize repository
const syncLogRepository: ISyncLogRepository = new SQLiteSyncLogRepository();

// POST /api/sync/test-connection - Test Google Calendar API connection
router.post('/test-connection', requireAuthAPI, handleAsync(async (req: Request, res: Response) => {
  const result = await googleCalendarService.testConnection();
  
  apiResponse.success(res, result, result.message);
}));

// POST /api/sync/calendars - Sync calendar list from Google
router.post('/calendars', requireAuthAPI, handleAsync(async (req: Request, res: Response) => {
  const result = await googleCalendarService.syncCalendarList();
  
  apiResponse.success(res, result, `Successfully synced calendars: ${result.imported} new, ${result.updated} updated`);
}));

// POST /api/sync/events - Sync events from selected Google calendars
router.post('/events', requireAuthAPI, handleAsync(async (req: Request, res: Response) => {
  const syncStartTime = new Date().toISOString();
  
  // Log sync start
  const syncLog = await syncLogRepository.createLog(
    'started',
    'Starting event sync from Google Calendar'
  );

  const result = await googleCalendarService.syncSelectedCalendarEvents();
  
  // Log sync completion
  await syncLogRepository.updateLog(
    syncLog.id,
    'completed',
    `Successfully synced ${result.events} events from ${result.calendars} calendars`,
    result.events
  );

  let message = `Successfully synced ${result.events} events from ${result.calendars} calendars`;
  if (result.errors.length > 0) {
    message += `. Warnings: ${result.errors.join(', ')}`;
  }
  
  apiResponse.success(res, result, message);
}));

// POST /api/sync/full - Full sync (calendars + events)
router.post('/full', requireAuthAPI, handleAsync(async (req: Request, res: Response) => {
  const syncStartTime = new Date().toISOString();
  
  // Log sync start
  const syncLog = await syncLogRepository.createLog(
    'started',
    'Starting full sync from Google Calendar'
  );

  // First sync calendars
  const calendarResult = await googleCalendarService.syncCalendarList();
  
  // Then sync events
  const eventResult = await googleCalendarService.syncSelectedCalendarEvents();
  
  const totalEvents = eventResult.events;
  const totalCalendars = calendarResult.imported + calendarResult.updated;
  
  // Log sync completion
  await syncLogRepository.updateLog(
    syncLog.id,
    'completed',
    `Full sync completed: ${totalCalendars} calendars, ${totalEvents} events`,
    totalEvents
  );

  apiResponse.success(res, {
    calendars: calendarResult,
    events: eventResult
  }, `Full sync completed: ${totalCalendars} calendars synced, ${totalEvents} events synced`);
}));

// GET /api/sync/logs - Get sync history
router.get('/logs', requireAuthAPI, handleAsync(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  
  const logs = await syncLogRepository.getLogs(parseInt(limit as string));
  apiResponse.success(res, logs, `Retrieved ${logs.length} sync log entries`);
}));

export default router;