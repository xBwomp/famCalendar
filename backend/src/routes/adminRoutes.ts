import { Router, Request, Response } from 'express';
import { requireAuthAPI } from '../middleware/auth';
import { db } from '../database/init';
import { ApiResponse, DisplayPreferences } from '../../../shared/types';

const router = Router();

// GET /admin/settings - Get admin settings
router.get('/settings', requireAuthAPI, (req: Request, res: Response) => {
  const query = 'SELECT key, value FROM admin_settings WHERE key NOT LIKE "%token%" AND key NOT LIKE "%secret%"';
  
  db.all(query, [], (err, rows: any[]) => {
    if (err) {
      console.error('Error fetching admin settings:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch admin settings'
      };
      return res.status(500).json(response);
    }

    // Convert rows to key-value object
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    const response: ApiResponse = {
      success: true,
      data: settings
    };
    res.json(response);
  });
});

// PUT /admin/settings - Update admin settings
router.put('/settings', requireAuthAPI, (req: Request, res: Response) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    const response: ApiResponse = {
      success: false,
      error: 'Settings object is required'
    };
    return res.status(400).json(response);
  }

  const settingsKeys = Object.keys(settings);

  if (settingsKeys.length === 0) {
    const response: ApiResponse = {
      success: false,
      error: 'No settings provided'
    };
    return res.status(400).json(response);
  }

  // Filter out sensitive keys
  const validKeys = settingsKeys.filter(key =>
    !key.includes('token') && !key.includes('secret') && !key.includes('admin_user')
  );

  if (validKeys.length === 0) {
    const response: ApiResponse = {
      success: true,
      message: 'No valid settings to update'
    };
    return res.json(response);
  }

  // Use Promise.all to handle all updates
  const updatePromises = validKeys.map(key => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, settings[key]],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  });

  Promise.all(updatePromises)
    .then(() => {
      const response: ApiResponse = {
        success: true,
        message: 'Settings updated successfully'
      };
      res.json(response);
    })
    .catch(err => {
      console.error('Error updating settings:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update settings'
      };
      res.status(500).json(response);
    });
});

// GET /admin/display-preferences - Get display preferences
router.get('/display-preferences', requireAuthAPI, (req: Request, res: Response) => {
  const keys = ['defaultView', 'daysToShow', 'startHour', 'endHour', 'showWeekends'];
  const query = `SELECT key, value FROM admin_settings WHERE key IN (${keys.map(() => '?').join(',')})`;
  
  db.all(query, keys, (err, rows: any[]) => {
    if (err) {
      console.error('Error fetching display preferences:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch display preferences'
      };
      return res.status(500).json(response);
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
        preferences[key] = row.value;
      } else if (key === 'showWeekends') {
        preferences[key] = row.value === 'true';
      } else {
        preferences[key] = parseInt(row.value) || defaultPrefs[key];
      }
    });

    const response: ApiResponse<DisplayPreferences> = {
      success: true,
      data: preferences
    };
    res.json(response);
  });
});

// PUT /admin/display-preferences - Update display preferences
router.put('/display-preferences', requireAuthAPI, (req: Request, res: Response) => {
  const { preferences } = req.body;

  if (!preferences || typeof preferences !== 'object') {
    const response: ApiResponse = {
      success: false,
      error: 'Preferences object is required'
    };
    return res.status(400).json(response);
  }

  const updates = Object.entries(preferences);

  if (updates.length === 0) {
    const response: ApiResponse = {
      success: false,
      error: 'No preferences provided'
    };
    return res.status(400).json(response);
  }

  // Use Promise.all to handle all updates
  const updatePromises = updates.map(([key, value]) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, String(value)],
        (err) => {
          if (err) {
            console.error('Error updating preference:', key, err);
            reject(err);
          } else {
            resolve(true);
          }
        }
      );
    });
  });

  Promise.all(updatePromises)
    .then(() => {
      const response: ApiResponse = {
        success: true,
        message: 'Display preferences updated successfully'
      };
      res.json(response);
    })
    .catch(err => {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update display preferences'
      };
      res.status(500).json(response);
    });
});

router.get('/last-sync-time', requireAuthAPI, (req: Request, res: Response) => {
  db.get('SELECT value FROM admin_settings WHERE key = ?', ['last_sync_time'], (err, row: any) => {
    if (err) {
      console.error('Error fetching last sync time:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch last sync time'
      };
      return res.status(500).json(response);
    }

    if (row) {
      const response: ApiResponse = {
        success: true,
        data: { lastSyncTime: row.value }
      };
      res.json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: 'Last sync time not found'
      };
      res.status(404).json(response);
    }
  });
});

export default router;