import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import { requireAuthAPI } from '../middleware/auth';
import { ApiResponse } from '../../../shared/types';

const router = Router();

// GET /auth/google - Initiate Google OAuth
router.get('/google', (req, res, next) => {
  console.log('Request to /auth/google received');
  passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'] }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/admin/dashboard');
    });
  })(req, res, next);
});

// Send console message
console.log("Initiate Google OAuth");

// GET /auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/admin/login?error=auth_failed' }),
  (req: Request, res: Response) => {
    // Successful authentication, redirect to admin dashboard
    res.redirect('/admin/dashboard');
  }
);

// POST /auth/logout - Logout user
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to logout'
      };
      return res.status(500).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'Logged out successfully'
    };
    res.json(response);
    return;
  });
});

// GET /auth/status - Check authentication status
router.get('/status', (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    const user = req.user as Express.User;
    const response: ApiResponse = {
      success: true,
      data: {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture
        }
      }
    };
    res.json(response);
  } else {
    const response: ApiResponse = {
      success: true,
      data: {
        authenticated: false
      }
    };
    res.json(response);
  }
});

// GET /auth/profile - Get user profile (protected)
router.get('/profile', requireAuthAPI, (req: Request, res: Response) => {
  const user = req.user as Express.User;
  const response: ApiResponse = {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    }
  };
  res.json(response);
});

export default router;
