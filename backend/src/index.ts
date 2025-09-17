import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/init';
import calendarRoutes from './routes/calendarRoutes';
import eventRoutes from './routes/eventRoutes';
import seedRoutes from './routes/seedRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/calendars', calendarRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/seed', seedRoutes);

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
    console.log('✅ Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📅 Calendars API: http://localhost:${PORT}/api/calendars`);
      console.log(`📆 Events API: http://localhost:${PORT}/api/events`);
      console.log(`🌱 Seed API: http://localhost:${PORT}/api/seed`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();