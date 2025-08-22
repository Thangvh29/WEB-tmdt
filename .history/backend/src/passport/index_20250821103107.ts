// src/passport/index.ts
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../models/user.model.js'; // dùng .js vì runtime sẽ resolve; ts-node xử lý
// If you plan to use google/facebook strategies, import them when configured: import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
 import { Strategy as FacebookStrategy } from 'passport-facebook';

/**
 * This file initializes passport: serializeUser/deserializeUser and a minimal local strategy placeholder.
 * Adjust strategies, field names and verify callbacks to match your app.
 */

// Serialize user id into session
passport.serializeUser((user: any, done) => {
  done(null, (user && user._id) ? String(user._id) : user);
});

// Deserialize: load user for session (select minimal fields)
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).select('-password -passwordResetToken -passwordResetExpires').lean();
    done(null, user || null);
  } catch (err) {
    done(err as any, null);
  }
});

// Minimal LocalStrategy (example only — adapt to your auth flow)
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    session: true,
  },
  async (email: string, password: string, done) => {
    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user) return done(null, false, { message: 'Incorrect email or password' });
      const ok = await user.comparePassword(password);
      if (!ok) return done(null, false, { message: 'Incorrect email or password' });
      // remove password before returning
      (user as any).password = undefined;
      return done(null, user);
    } catch (err) {
      return done(err as any);
    }
  }
));

// Optionally: initialize google/facebook strategies here using config values
// Example placeholder (uncomment + configure when ready):
/*
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  // find or create user
}));
*/

export default passport;
