import { Router, Request, Response } from 'express';
import { CalendarEvent, ApiResponse } from '../../../shared/types';
import { EventSchema, EventQuerySchema, validateQuery } from '../middleware/validation';
import { z } from 'zod';
import { handleAsync, apiResponse, DatabaseError, ValidationError, NotFoundError } from '../utils/errorHandler';
import { SQLiteEventRepository, IEventRepository } from '../repositories/eventRepository';

const router = Router();

// Initialize repository
const eventRepository: IEventRepository = new SQLiteEventRepository();

// GET /api/events - Retrieve events with optional filtering
router.get('/', validateQuery(EventQuerySchema), handleAsync(async (req: Request, res: Response) => {
  const { calendar_id, start_date, end_date, limit } = req.query;
  
  let events: any[] = [];
  
  if (calendar_id) {
    // Filter by specific calendar
    events = await eventRepository.getEventsByCalendarId(calendar_id as string);
  } else if (start_date || end_date) {
    // Filter by date range
    const startDate = start_date as string || new Date(0).toISOString();
    const endDate = end_date as string || new Date().toISOString();
    events = await eventRepository.getEventsByDateRange(startDate, endDate);
  } else {
    // Get today's events as default
    events = await eventRepository.getTodaysEvents();
  }

  // Apply limit if specified
  if (limit) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum <= 0) {
      throw new ValidationError('Invalid limit parameter');
    }
    events = events.slice(0, limitNum);
  }
  
  apiResponse.success(res, events, `Retrieved ${events.length} events`);
}));

// GET /api/events/today - Get today's events
router.get('/today', handleAsync(async (req: Request, res: Response) => {
  const events = await eventRepository.getTodaysEvents();
  apiResponse.success(res, events, `Retrieved ${events.length} events for today`);
}));

// POST /api/events - Create a new event (for testing/seeding)
router.post('/', handleAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = EventSchema.parse(req.body);
  
  const eventData: Omit<CalendarEvent, 'created_at' | 'updated_at'> = {
    id: validatedData.id,
    calendar_id: validatedData.calendar_id,
    title: validatedData.title,
    description: validatedData.description || undefined,
    start_time: validatedData.start_time,
    end_time: validatedData.end_time,
    all_day: validatedData.all_day || false,
    location: validatedData.location || undefined
  };

  const createdEvent = await eventRepository.createEvent(eventData);
  
  apiResponse.created(res, { id: createdEvent.id }, `Event "${createdEvent.title}" created successfully`);
}));

// DELETE /api/events/:id - Delete an event
router.delete('/:id', handleAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const eventId = Array.isArray(id) ? id[0] : id;

  const success = await eventRepository.deleteEvent(eventId);
  
  if (!success) {
    throw new NotFoundError('Event not found');
  }
  
  apiResponse.success(res, null, 'Event deleted successfully');
}));

export default router;