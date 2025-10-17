import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../database/init';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

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
    const storeToken = (key: string, value: string, shouldEncrypt: boolean = false) => {
      return new Promise<void>((resolve, reject) => {
        const valueToStore = shouldEncrypt ? encrypt(value) : value;
        db.run(
          'INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [key, valueToStore],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    };

    // Store access token and refresh token (encrypted)
    await storeToken('google_access_token', accessToken, true);
    if (refreshToken) {
      await storeToken('google_refresh_token', refreshToken, true);
    }
    await storeToken('admin_user_id', user.id);
    await storeToken('admin_user_email', user.email);
    await storeToken('admin_user_name', user.name);
    if (user.picture) {
      await storeToken('admin_user_picture', user.picture);
    }

    
    return done(null, user);
  } catch (error) {
    
    return done(error, undefined);
  }
}));

// Serialize user for session
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id: string, done) => {
  const keys = [
    'admin_user_id',
    'admin_user_email',
    'admin_user_name',
    'admin_user_picture',
    'google_access_token',
    'google_refresh_token'
  ];
  const query = `SELECT key, value FROM admin_settings WHERE key IN (${keys.map(() => '?').join(',')})`;

  db.all(query, keys, (err, rows: any[]) => {
    if (err) {
      return done(err, null);
    }

    if (!rows || rows.length === 0) {
      return done(null, undefined);
    }

    const userSettings: Record<string, string> = {};
    rows.forEach(row => {
      userSettings[row.key] = row.value;
    });

    // Decrypt tokens if they are encrypted
    let accessToken = userSettings.google_access_token;
    let refreshToken = userSettings.google_refresh_token;

    try {
      if (accessToken && isEncrypted(accessToken)) {
        accessToken = decrypt(accessToken);
      }
      if (refreshToken && isEncrypted(refreshToken)) {
        refreshToken = decrypt(refreshToken);
      }
    } catch (error) {
      console.error('Error decrypting tokens:', error);
      return done(new Error('Failed to decrypt authentication tokens'), null);
    }

    const user: Express.User = {
      id: userSettings.admin_user_id,
      email: userSettings.admin_user_email,
      name: userSettings.admin_user_name,
      picture: userSettings.admin_user_picture || undefined,
      accessToken: accessToken,
      refreshToken: refreshToken || undefined
    };

    done(null, user);
  });
});

export default passport;
