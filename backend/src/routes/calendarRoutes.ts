import { Router, Request, Response } from 'express';
import { Calendar, ApiResponse } from '../../../shared/types';
import { CalendarSchema } from '../middleware/validation';
import { z } from 'zod';
import { handleAsync, apiResponse, DatabaseError, NotFoundError, ValidationError } from '../utils/errorHandler';
import { SQLiteCalendarRepository, ICalendarRepository } from '../repositories/calendarRepository';

const router = Router();

// Initialize repository
const calendarRepository: ICalendarRepository = new SQLiteCalendarRepository();

// GET /api/calendars - Retrieve all calendars
router.get('/', handleAsync(async (req: Request, res: Response) => {
  const calendars = await calendarRepository.getAllCalendars();
  apiResponse.success(res, calendars);
}));

// GET /api/calendars/selected - Retrieve only selected calendars
router.get('/selected', handleAsync(async (req: Request, res: Response) => {
  const calendars = await calendarRepository.getSelectedCalendars();
  apiResponse.success(res, calendars, `Retrieved ${calendars.length} selected calendars`);
}));

// POST /api/calendars - Create a new calendar (for testing/seeding)
router.post('/', handleAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = CalendarSchema.parse(req.body);
  
  const calendarData: Omit<Calendar, 'created_at' | 'updated_at'> = {
    id: validatedData.id,
    name: validatedData.name,
    description: validatedData.description || undefined,
    color: validatedData.color || '#3B82F6',
    selected: validatedData.selected || false
  };

  const createdCalendar = await calendarRepository.createCalendar(calendarData);
  
  apiResponse.created(res, { id: createdCalendar.id }, `Calendar "${createdCalendar.name}" created successfully`);
}));

// PUT /api/calendars/:id/toggle - Toggle calendar selection
router.put('/:id/toggle', handleAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const calendarId = Array.isArray(id) ? id[0] : id;

  await calendarRepository.toggleCalendarSelection(calendarId);
  
  apiResponse.success(res, null, 'Calendar selection toggled successfully');
}));

export default router;