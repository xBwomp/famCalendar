# Family Calendar Dashboard

A local calendar dashboard application designed to run on a Raspberry Pi, providing a read-only, easy-to-view calendar display accessible to anyone on the local network.

## Features

- **Public Calendar Dashboard**: Accessible to anyone on the local network (no login required)
- **Admin Panel**: Protected by Google OAuth2 authentication for configuration
- **Google Calendar Integration**: Sync events from selected Google Calendars
- **Offline-First**: All events stored locally in SQLite3 for reliable offline viewing
- **Responsive Design**: Optimized for kiosk/tablet display (10-inch tablets)
- **Multiple Views**: Day, Week, and Month calendar views

## Architecture

This is a monorepo containing:

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + SQLite3
- **Shared**: Common types and utilities

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your Google OAuth2 credentials
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

```
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
│   ├── src/          # TypeScript source code
│   ├── db/           # SQLite database files
│   └── dist/         # Compiled JavaScript (generated)
├── shared/           # Shared types and utilities
└── docs/            # Documentation (deployment, setup, etc.)
```

## Development

- Frontend runs on `http://localhost:5173`
- Backend API runs on `http://localhost:3001`
- Database: SQLite3 file at `backend/db/calendar.db`

## Security

- Only the admin panel requires authentication (Google OAuth2)
- All public dashboard access is unrestricted on the LAN
- Credentials and sensitive data are never exposed to public endpoints

## License

MIT