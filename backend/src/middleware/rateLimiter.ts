import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../../shared/types';

// Create rate limiters for different types of requests
const authRateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per 60 seconds
});

const apiRateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

const sensitiveApiRateLimiter = new RateLimiterMemory({
  points: 20, // 20 requests
  duration: 60, // per 60 seconds
});

// Middleware for authentication routes (login, etc.)
export const authRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || 'unknown';
    const rateLimitRes = await authRateLimiter.get(key);
    
    if (rateLimitRes !== null && rateLimitRes.remainingPoints <= 0) {
      const retryAfter = Math.ceil(rateLimitRes.msBeforeNext / 1000);
      const response: ApiResponse = {
        success: false,
        error: 'Too many requests',
        message: `Please try again in ${retryAfter} seconds`
      };
      return res.status(429).json(response);
    }
    
    await authRateLimiter.consume(key);
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error'
    };
    res.status(500).json(response);
  }
};

// Middleware for general API routes
export const apiRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || 'unknown';
    const rateLimitRes = await apiRateLimiter.get(key);
    
    if (rateLimitRes !== null && rateLimitRes.remainingPoints <= 0) {
      const retryAfter = Math.ceil(rateLimitRes.msBeforeNext / 1000);
      const response: ApiResponse = {
        success: false,
        error: 'Too many requests',
        message: `Please try again in ${retryAfter} seconds`
      };
      return res.status(429).json(response);
    }
    
    await apiRateLimiter.consume(key);
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error'
    };
    res.status(500).json(response);
  }
};

// Middleware for sensitive API routes (admin, write operations)
export const sensitiveApiRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || 'unknown';
    const rateLimitRes = await sensitiveApiRateLimiter.get(key);
    
    if (rateLimitRes !== null && rateLimitRes.remainingPoints <= 0) {
      const retryAfter = Math.ceil(rateLimitRes.msBeforeNext / 1000);
      const response: ApiResponse = {
        success: false,
        error: 'Too many requests',
        message: `Please try again in ${retryAfter} seconds`
      };
      return res.status(429).json(response);
    }
    
    await sensitiveApiRateLimiter.consume(key);
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error'
    };
    res.status(500).json(response);
  }
};