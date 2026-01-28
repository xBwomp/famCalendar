import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../../shared/types';
import logger from '../utils/logger';

// Validation schemas using Zod

// Event validation schema
export const EventSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
  calendar_id: z.string().min(1, 'Calendar ID is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  start_time: z.string().datetime('Invalid datetime format for start_time'),
  end_time: z.string().datetime('Invalid datetime format for end_time'),
  all_day: z.boolean().optional(),
  location: z.string().max(255, 'Location is too long').optional(),
}).refine((data) => {
  return new Date(data.start_time) < new Date(data.end_time);
}, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

// Calendar validation schema
export const CalendarSchema = z.object({
  id: z.string().min(1, 'Calendar ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  selected: z.boolean().optional(),
});

// Query parameter validation schemas
export const EventQuerySchema = z.object({
  calendar_id: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  limit: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num > 0 && num <= 1000;
  }, 'Limit must be a positive number between 1 and 1000').optional(),
});

// Admin settings validation schema
export const AdminSettingsSchema = z.object({
  settings: z.record(z.string(), z.string()),
});

// Display preferences validation schema
export const DisplayPreferencesSchema = z.object({
  preferences: z.object({
    defaultView: z.enum(['day', 'week', 'month']).optional(),
    daysToShow: z.number().int().min(1).max(31).optional(),
    startHour: z.number().int().min(0).max(23).optional(),
    endHour: z.number().int().min(0).max(23).optional(),
    showWeekends: z.boolean().optional(),
  }),
});

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body for POST/PUT requests
      if (req.method === 'POST' || req.method === 'PUT') {
        schema.parse(req.body);
      }
      
      // Validate query parameters for GET requests
      if (req.method === 'GET') {
        schema.parse(req.query);
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError<any>;
        const errors = zodError.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: { errors },
        };
        
        return res.status(400).json(response);
      }
      
      logger.error('Validation error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal validation error',
      };
      
      res.status(500).json(response);
    }
  };

// Middleware to validate query parameters
export const validateQuery = (schema: z.ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError<any>;
        const errors = zodError.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: { errors },
        };
        
        return res.status(400).json(response);
      }
      
      logger.error('Query validation error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal validation error',
      };
      
      res.status(500).json(response);
    }
  };
