import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { initializeDatabase } from './database/init';
import passport from './config/passport';
import calendarRoutes from './routes/calendarRoutes';
import eventRoutes from './routes/eventRoutes';
import seedRoutes from './routes/seedRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import syncRoutes from './routes/syncRoutes';
import logger from './utils/logger';

const app = express();
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

logger.info('Loading backend/src/index.ts');

// Validate required environment variables
if (!process.env.SESSION_SECRET) {
  logger.error('❌ FATAL: SESSION_SECRET environment variable is required');
  logger.error('Please set SESSION_SECRET in your .env file to a secure random string');
  logger.error('Example: SESSION_SECRET=your-super-secret-random-string-here');
  process.exit(1);
}

if (!process.env.ENCRYPTION_KEY) {
  logger.error('❌ FATAL: ENCRYPTION_KEY environment variable is required');
  logger.error('This key is used to encrypt sensitive tokens in the database');
  logger.error('Please set ENCRYPTION_KEY in your .env file to a secure random string (minimum 32 characters)');
  logger.error('Example: ENCRYPTION_KEY=your-super-secret-encryption-key-at-least-32-chars');
  process.exit(1);
}

// Parse CORS origins from environment variable
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3001']; // Default for development

logger.info(`🔒 CORS allowed origins: ${JSON.stringify(allowedOrigins)}`);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Morgan Middleware for HTTP logging
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(' ')[0],
          url: message.split(' ')[1],
          status: message.split(' ')[2],
          responseTime: message.split(' ')[5],
        };
        logger.http(message.trim(), logObject);
      },
    },
  })
);

// Rate limiting middleware
import { authRateLimit, apiRateLimit, sensitiveApiRateLimit } from './middleware/rateLimiter';

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// API Routes
logger.info('Registering auth routes');
app.use('/auth', authRateLimit, authRoutes);
app.use('/api/admin', sensitiveApiRateLimit, adminRoutes);
app.use('/api/calendars', apiRateLimit, calendarRoutes);
app.use('/api/events', apiRateLimit, eventRoutes);
app.use('/api/seed', apiRateLimit, seedRoutes);
app.use('/api/sync', apiRateLimit, syncRoutes);

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Family Calendar API is running',
    version: '1.0.0',
    database: 'SQLite3 connected'
  });
});

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    logger.info('✅ Database initialized successfully');
    
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`\uD83D\uDCCA Health check: http://${HOST}:${PORT}/api/health`);
      logger.info(`\uD83D\uDD10 Google OAuth: http://${HOST}:${PORT}/auth/google`);
      logger.info(`\uD83D\uDC64 Auth status: http://${HOST}:${PORT}/auth/status`);
      logger.info(`\uD83D\uDCC5 Calendars API: http://${HOST}:${PORT}/api/calendars`);
      logger.info(`\uD83D\uDCC6 Events API: http://${HOST}:${PORT}/api/events`);
      logger.info(`\uD83C\uDF31 Seed API: http://${HOST}:${PORT}/api/seed`);
      logger.info(`\uD83D\uDD04 Sync API: http://${HOST}:${PORT}/api/sync`);
      logger.info(`⚙️  Admin API: http://${HOST}:${PORT}/api/admin`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();