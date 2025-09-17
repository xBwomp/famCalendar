import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../database/init';

// Configure Google OAuth2 strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_REDIRECT_URI || '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = {
      id: profile.id,
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName || '',
      picture: profile.photos?.[0]?.value,
      accessToken,
      refreshToken
    };

    // Store tokens in admin_settings for later use
    const storeToken = (key: string, value: string) => {
      return new Promise<void>((resolve, reject) => {
        db.run(
          'INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [key, value],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    };

    // Store access token and refresh token
    await storeToken('google_access_token', accessToken);
    if (refreshToken) {
      await storeToken('google_refresh_token', refreshToken);
    }
    await storeToken('admin_user_id', user.id);
    await storeToken('admin_user_email', user.email);
    await storeToken('admin_user_name', user.name);
    if (user.picture) {
      await storeToken('admin_user_picture', user.picture);
    }

    console.log('✅ User authenticated and tokens stored:', user.email);
    return done(null, user);
  } catch (error) {
    console.error('❌ Error in Google OAuth callback:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id: string, done) => {
  // Retrieve user info from admin_settings
  db.get('SELECT value FROM admin_settings WHERE key = ?', ['admin_user_email'], (err, row: any) => {
    if (err) {
      return done(err, null);
    }
    
    if (!row) {
      return done(null, null);
    }

    // Reconstruct user object from stored settings
    const getUserSettings = () => {
      return new Promise<Express.User>((resolve, reject) => {
        const queries = [
          'SELECT value FROM admin_settings WHERE key = "admin_user_id"',
          'SELECT value FROM admin_settings WHERE key = "admin_user_email"',
          'SELECT value FROM admin_settings WHERE key = "admin_user_name"',
          'SELECT value FROM admin_settings WHERE key = "admin_user_picture"',
          'SELECT value FROM admin_settings WHERE key = "google_access_token"',
          'SELECT value FROM admin_settings WHERE key = "google_refresh_token"'
        ];

        const results: string[] = [];
        let completed = 0;

        queries.forEach((query, index) => {
          db.get(query, [], (err, row: any) => {
            if (err) {
              reject(err);
              return;
            }
            results[index] = row?.value || '';
            completed++;
            
            if (completed === queries.length) {
              const user: Express.User = {
                id: results[0],
                email: results[1],
                name: results[2],
                picture: results[3] || undefined,
                accessToken: results[4],
                refreshToken: results[5] || undefined
              };
              resolve(user);
            }
          });
        });
      });
    };

    getUserSettings()
      .then(user => done(null, user))
      .catch(err => done(err, null));
  });
});

export default passport;