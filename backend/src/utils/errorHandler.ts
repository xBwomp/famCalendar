/**
 * Centralized error handling module for the Family Calendar API
 * Provides consistent error handling and response formatting across all endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from './logger';

/**
 * Base API error class for operational errors
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public details?: any
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 500, true, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Validation errors (400 Bad Request)
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, true, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication errors (401 Unauthorized)
 */
export class AuthError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 401, true, details);
    this.name = 'AuthError';
  }
}

/**
 * Authorization errors (403 Forbidden)
 */
export class ForbiddenError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 403, true, details);
    this.name = 'ForbiddenError';
  }
}

/**
 * Resource not found errors (404 Not Found)
 */
export class NotFoundError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 404, true, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Wrapper function to handle async route errors consistently
 */
export const handleAsync = (fn: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle known API errors
        logger.error(`🔴 ${error.name}: ${error.message}`);
        if (error.details) {
          logger.error('Details:', error.details);
        }
        
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          ...(error.details && { details: error.details })
        });
      }

      // Handle Zod validation errors specifically
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError<any>;
        const validationError = new ValidationError('Validation failed', {
          errors: zodError.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        });
        
        logger.error('🔴 Validation Error:', validationError);
        return res.status(validationError.statusCode).json({
          success: false,
          error: validationError.message,
          details: validationError.details
        });
      }

      // Handle all other unexpected errors
      logger.error('❌ Unexpected error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  };
};

/**
 * Standardized API response format
 */
export const apiResponse = {
  success: (res: Response, data?: any, message?: string) => {
    return res.json({
      success: true,
      ...(data && { data }),
      ...(message && { message })
    });
  },
  
  created: (res: Response, data?: any, message?: string) => {
    return res.status(201).json({
      success: true,
      ...(data && { data }),
      ...(message && { message })
    });
  },
  
  noContent: (res: Response) => {
    return res.status(204).send();
  }
};
