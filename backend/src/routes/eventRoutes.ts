import { Router, Request, Response } from 'express';
import { db } from '../database/init';
import { CalendarEvent, ApiResponse } from '../../../shared/types';

const router = Router();

// GET /api/events - Retrieve events with optional filtering
router.get('/', (req: Request, res: Response) => {
  const { calendar_id, start_date, end_date, limit } = req.query;
  
  let query = `
    SELECT e.*, c.name as calendar_name, c.color as calendar_color
    FROM events e
    JOIN calendars c ON e.calendar_id = c.id
    WHERE c.selected = 1
  `;
  const params: any[] = [];

  // Add calendar filter
  if (calendar_id) {
    query += ' AND e.calendar_id = ?';
    params.push(calendar_id);
  }

  // Add date range filter
  if (start_date) {
    query += ' AND e.end_time >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND e.start_time <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY e.start_time ASC';

  // Add limit
  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit as string));
  }

  db.all(query, params, (err, rows: any[]) => {
    if (err) {
      console.error('Error fetching events:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch events'
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse<any[]> = {
      success: true,
      data: rows,
      message: `Retrieved ${rows.length} events`
    };
    res.json(response);
  });
});

// GET /api/events/today - Get today's events
router.get('/today', (req: Request, res: Response) => {
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
      console.error('Error fetching today\'s events:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch today\'s events'
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse<any[]> = {
      success: true,
      data: rows,
      message: `Retrieved ${rows.length} events for today`
    };
    res.json(response);
  });
});

// POST /api/events - Create a new event (for testing/seeding)
router.post('/', (req: Request, res: Response) => {
  const { 
    id, 
    calendar_id, 
    title, 
    description, 
    start_time, 
    end_time, 
    all_day, 
    location 
  } = req.body;

  if (!id || !calendar_id || !title || !start_time || !end_time) {
    const response: ApiResponse = {
      success: false,
      error: 'Event ID, calendar_id, title, start_time, and end_time are required'
    };
    return res.status(400).json(response);
  }

  // Verify calendar exists
  db.get('SELECT id FROM calendars WHERE id = ?', [calendar_id], (err, calendar) => {
    if (err) {
      console.error('Error checking calendar:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to verify calendar'
      };
      return res.status(500).json(response);
    }

    if (!calendar) {
      const response: ApiResponse = {
        success: false,
        error: 'Calendar not found'
      };
      return res.status(404).json(response);
    }

    const query = `
      INSERT INTO events (
        id, calendar_id, title, description, start_time, end_time, 
        all_day, location, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const params = [
      id,
      calendar_id,
      title,
      description || null,
      start_time,
      end_time,
      all_day ? 1 : 0,
      location || null
    ];

    db.run(query, params, function(err) {
      if (err) {
        console.error('Error creating event:', err);
        const response: ApiResponse = {
          success: false,
          error: 'Failed to create event'
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse = {
        success: true,
        message: `Event "${title}" created successfully`,
        data: { id, insertedId: this.lastID }
      };
      return res.status(201).json(response);
    });
  });
});

// DELETE /api/events/:id - Delete an event
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const query = 'DELETE FROM events WHERE id = ?';

  db.run(query, [id], function(err) {
    if (err) {
      console.error('Error deleting event:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete event'
      };
      return res.status(500).json(response);
    }

    if (this.changes === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Event not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Event deleted successfully'
    };
    res.json(response);
  });
});

export default router;