import { Router, Request, Response } from 'express';
import { db } from '../database/init';
import { ApiResponse } from '../../../shared/types';

const router = Router();

// POST /api/seed/sample-data - Create sample calendars and events for testing
router.post('/sample-data', (req: Request, res: Response) => {
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
  db.serialize(() => {
    db.run('DELETE FROM events');
    db.run('DELETE FROM calendars');

    // Insert sample calendars
    const calendarStmt = db.prepare(`
      INSERT INTO calendars (id, name, description, color, selected, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    sampleCalendars.forEach(calendar => {
      calendarStmt.run([
        calendar.id,
        calendar.name,
        calendar.description,
        calendar.color,
        calendar.selected ? 1 : 0
      ]);
    });

    calendarStmt.finalize();

    // Insert sample events
    const eventStmt = db.prepare(`
      INSERT INTO events (id, calendar_id, title, description, start_time, end_time, all_day, location, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    sampleEvents.forEach(event => {
      eventStmt.run([
        event.id,
        event.calendar_id,
        event.title,
        event.description,
        event.start_time,
        event.end_time,
        event.all_day ? 1 : 0,
        event.location
      ]);
    });

    eventStmt.finalize((err) => {
      if (err) {
        console.error('Error seeding sample data:', err);
        const response: ApiResponse = {
          success: false,
          error: 'Failed to seed sample data'
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse = {
        success: true,
        message: `Successfully seeded ${sampleCalendars.length} calendars and ${sampleEvents.length} events`,
        data: {
          calendars: sampleCalendars.length,
          events: sampleEvents.length
        }
      };
      res.json(response);
      return; // Explicit return after sending response
    });
  });
});

// DELETE /api/seed/clear-data - Clear all calendars and events
router.delete('/clear-data', (req: Request, res: Response) => {
  db.serialize(() => {
    db.run('DELETE FROM events');
    db.run('DELETE FROM calendars', (err) => {
      if (err) {
        console.error('Error clearing data:', err);
        const response: ApiResponse = {
          success: false,
          error: 'Failed to clear data'
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse = {
        success: true,
        message: 'All calendars and events cleared successfully'
      };
      res.json(response);
      return; // Explicit return after sending response
    });
  });
});

export default router;