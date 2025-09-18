import { Router, Request, Response } from 'express';
import { db } from '../database/init';
import { Calendar, ApiResponse } from '../../../shared/types';

const router = Router();

// GET /api/calendars - Retrieve all calendars
router.get('/', (req: Request, res: Response): void => {
  const query = 'SELECT * FROM calendars ORDER BY name';
  db.all(query, [], (err, rows: Calendar[]) => {
    if (err) {
      res.status(500).json({ success: false, message: 'DB error' });
      return;
    }
    res.json({ success: true, data: rows });
  });
});

// GET /api/calendars/selected - Retrieve only selected calendars
router.get('/selected', (req: Request, res: Response) => {
  const query = 'SELECT * FROM calendars WHERE selected = 1 ORDER BY name ASC';
  
  db.all(query, [], (err, rows: Calendar[]) => {
    if (err) {
      console.error('Error fetching selected calendars:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch selected calendars'
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse<Calendar[]> = {
      success: true,
      data: rows,
      message: `Retrieved ${rows.length} selected calendars`
    };
    res.json(response);
  });
});

// POST /api/calendars - Create a new calendar (for testing/seeding)
router.post('/', (req: Request, res: Response) => {
  const { id, name, description, color, selected } = req.body;

  if (!id || !name) {
    const response: ApiResponse = {
      success: false,
      error: 'Calendar ID and name are required'
    };
    return res.status(400).json(response);
  }

  const query = `
    INSERT INTO calendars (id, name, description, color, selected, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;

  const params = [
    id,
    name,
    description || null,
    color || '#3B82F6',
    selected ? 1 : 0
  ];

  db.run(query, params, function(err) {
    if (err) {
      console.error('Error creating calendar:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create calendar'
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: `Calendar "${name}" created successfully`,
      data: { id, insertedId: this.lastID }
    };
    res.status(201).json(response);
  });
});

// PUT /api/calendars/:id/toggle - Toggle calendar selection
router.put('/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;

  const query = `
    UPDATE calendars 
    SET selected = CASE WHEN selected = 1 THEN 0 ELSE 1 END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [id], function(err) {
    if (err) {
      console.error('Error toggling calendar selection:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to toggle calendar selection'
      };
      return res.status(500).json(response);
    }

    if (this.changes === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Calendar not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Calendar selection toggled successfully'
    };
    res.json(response);
  });
});

export default router;