import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../../shared/types';
import { handleAsync, apiResponse, DatabaseError } from '../utils/errorHandler';
import { SQLiteCalendarRepository, ICalendarRepository } from '../repositories/calendarRepository';
import { SQLiteEventRepository, IEventRepository } from '../repositories/eventRepository';

const router = Router();

// Initialize repositories
const calendarRepository: ICalendarRepository = new SQLiteCalendarRepository();
const eventRepository: IEventRepository = new SQLiteEventRepository();

// POST /api/seed/sample-data - Create sample calendars and events for testing
router.post('/sample-data', handleAsync(async (req: Request, res: Response) => {
  const sampleCalendars = [
    {
      id: 'family-calendar',
      name: 'Family Calendar',
      description: 'Family events and activities',
      color: '#3B82F6',
      selected: true
    },
    {
      id: 'work-calendar',
      name: 'Work Calendar',
      description: 'Work meetings and deadlines',
      color: '#EF4444',
      selected: true
    },
    {
      id: 'personal-calendar',
      name: 'Personal Calendar',
      description: 'Personal appointments and reminders',
      color: '#10B981',
      selected: false
    }
  ];

  const sampleEvents = [
    {
      id: 'event-1',
      calendar_id: 'family-calendar',
      title: 'Family Dinner',
      description: 'Weekly family dinner at home',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // Tomorrow + 2 hours
      all_day: false,
      location: 'Home'
    },
    {
      id: 'event-2',
      calendar_id: 'work-calendar',
      title: 'Team Meeting',
      description: 'Weekly team standup meeting',
      start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Day after tomorrow + 1 hour
      all_day: false,
      location: 'Conference Room A'
    },
    {
      id: 'event-3',
      calendar_id: 'family-calendar',
      title: 'Weekend Trip',
      description: 'Family weekend getaway',
      start_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      all_day: true,
      location: 'Mountain Resort'
    },
    {
      id: 'event-4',
      calendar_id: 'personal-calendar',
      title: 'Doctor Appointment',
      description: 'Annual checkup',
      start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 3 days from now + 1 hour
      all_day: false,
      location: 'Medical Center'
    }
  ];

  // Clear existing data
  for (const calendar of await calendarRepository.getAllCalendars()) {
    await eventRepository.deleteEventsByCalendarId(calendar.id);
    await calendarRepository.deleteCalendar(calendar.id);
  }

  // Insert sample calendars
  for (const calendar of sampleCalendars) {
    await calendarRepository.createCalendar(calendar);
  }

  // Insert sample events
  for (const event of sampleEvents) {
    await eventRepository.createEvent(event);
  }
  
  apiResponse.success(res, {
    calendars: sampleCalendars.length,
    events: sampleEvents.length
  }, `Successfully seeded ${sampleCalendars.length} calendars and ${sampleEvents.length} events`);
}));

// DELETE /api/seed/clear-data - Clear all calendars and events
router.delete('/clear-data', handleAsync(async (req: Request, res: Response) => {
  // Clear all events first
  for (const calendar of await calendarRepository.getAllCalendars()) {
    await eventRepository.deleteEventsByCalendarId(calendar.id);
  }

  // Then clear all calendars
  for (const calendar of await calendarRepository.getAllCalendars()) {
    await calendarRepository.deleteCalendar(calendar.id);
  }
  
  apiResponse.success(res, null, 'All calendars and events cleared successfully');
}));

export default router;