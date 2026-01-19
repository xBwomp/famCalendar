import { Router, Request, Response } from 'express';
import { requireAuthAPI } from '../middleware/auth';
import { ApiResponse, DisplayPreferences } from '../../../shared/types';
import { AdminSettingsSchema, DisplayPreferencesSchema } from '../middleware/validation';
import { z } from 'zod';
import { handleAsync, apiResponse, DatabaseError, ValidationError, NotFoundError } from '../utils/errorHandler';
import { SQLiteAdminSettingsRepository, IAdminSettingsRepository } from '../repositories/adminSettingsRepository';

const router = Router();

// Initialize repository
const adminSettingsRepository: IAdminSettingsRepository = new SQLiteAdminSettingsRepository();

// GET /admin/settings - Get admin settings
router.get('/settings', requireAuthAPI, handleAsync(async (req: Request, res: Response) => {
  const settings = await adminSettingsRepository.getAllSettings();
  apiResponse.success(res, settings);
}));

// PUT /admin/settings - Update admin settings
router.put('/settings', requireAuthAPI, handleAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = AdminSettingsSchema.parse(req.body);
  const { settings } = validatedData;

  const settingsKeys = Object.keys(settings);

  if (settingsKeys.length === 0) {
    throw new ValidationError('No settings provided');
  }

  // Filter out sensitive keys
  const validSettings: Record<string, string> = {};
  settingsKeys.forEach(key => {
    if (!key.includes('token') && !key.includes('secret') && !key.includes('admin_user')) {
      validSettings[key] = settings[key];
    }
  });

  if (Object.keys(validSettings).length === 0) {
    apiResponse.success(res, null, 'No valid settings to update');
    return;
  }

  await adminSettingsRepository.updateSettings(validSettings);
  
  apiResponse.success(res, null, 'Settings updated successfully');
}));

// GET /admin/display-preferences - Get display preferences
router.get('/display-preferences', requireAuthAPI, handleAsync(async (req: Request, res: Response) => {
  const preferences = await adminSettingsRepository.getDisplayPreferences();
  apiResponse.success(res, preferences);
}));

// PUT /admin/display-preferences - Update display preferences
router.put('/display-preferences', requireAuthAPI, handleAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = DisplayPreferencesSchema.parse(req.body);
  const { preferences } = validatedData;

  // Ensure all required fields are present with defaults
  const completePreferences: DisplayPreferences = {
    defaultView: preferences.defaultView || 'week',
    daysToShow: preferences.daysToShow || 7,
    startHour: preferences.startHour || 7,
    endHour: preferences.endHour || 20,
    showWeekends: preferences.showWeekends || true
  };

  await adminSettingsRepository.updateDisplayPreferences(completePreferences);
  
  apiResponse.success(res, null, 'Display preferences updated successfully');
}));

router.get('/last-sync-time', requireAuthAPI, handleAsync(async (req: Request, res: Response) => {
  const lastSyncTime = await adminSettingsRepository.getSetting('last_sync_time');
  
  if (!lastSyncTime) {
    throw new NotFoundError('Last sync time not found');
  }
  
  apiResponse.success(res, { lastSyncTime });
}));

export default router;