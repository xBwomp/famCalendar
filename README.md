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

- Frontend runs on `http://192.168.1.123:5173`
- Backend API runs on `http://192.168.1.123:3001`
- Database: SQLite3 file at `backend/db/calendar.db`

## Security

- Only the admin panel requires authentication (Google OAuth2)
- All public dashboard access is unrestricted on the LAN
- Credentials and sensitive data are never exposed to public endpoints
- OAuth tokens are encrypted at rest using AES-256-GCM encryption

### Important Security Notes

#### Environment Variables
The application requires several security-critical environment variables:

- **`SESSION_SECRET`**: Required for session cookie signing. Generate a secure random string (minimum 32 characters)
- **`ENCRYPTION_KEY`**: Required for encrypting OAuth tokens in the database. Generate a secure random string (minimum 32 characters)
- **`CORS_ORIGINS`**: Comma-separated list of allowed origins for CORS (e.g., `http://localhost:5173,http://192.168.1.123:5173`)

**Generate secure keys using:**
```bash
# On Linux/Mac
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Token Encryption
- OAuth access and refresh tokens are automatically encrypted before being stored in the database
- Encryption uses AES-256-GCM with PBKDF2 key derivation (100,000 iterations)
- Each encrypted value has a unique salt and initialization vector
- Authentication tags prevent tampering

#### Security Best Practices
🔑 **Keep encryption keys secret**: Never commit `.env` files to version control
🔄 **Rotate keys periodically**: Change `SESSION_SECRET` and `ENCRYPTION_KEY` on a regular schedule
⚠️ **Re-authentication required**: After adding encryption, you'll need to log in again to re-encrypt existing tokens
📝 **Production deployment**: Consider using a secrets management service (AWS Secrets Manager, HashiCorp Vault) for production encryption keys
🔒 **Database backups**: Even with encrypted backups, store the database file securely

## License

MIT