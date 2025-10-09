import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import { query } from './database';
import { User } from '../types/user';

export const initializePassport = (): void => {
  // Local Strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email: string, password: string, done) => {
      try {
        const result = await query(
          'SELECT * FROM users WHERE email = $1',
          [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Remove password from user object
        const { password_hash, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // JWT Strategy
  passport.use(new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'fallback_secret'
    },
    async (payload, done) => {
      try {
        const result = await query(
          'SELECT id, email, display_name, avatar_url, bio, skills, created_at, updated_at FROM users WHERE id = $1',
          [payload.id]
        );

        if (result.rows.length === 0) {
          return done(null, false);
        }

        return done(null, result.rows[0]);
      } catch (error) {
        return done(error, false);
      }
    }
  ));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'), false);
          }

          // Check if user already exists
          let result = await query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
          );

          if (result.rows.length > 0) {
            // User exists, update Google info
            const updateResult = await query(
              `UPDATE users 
               SET google_id = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP 
               WHERE email = $3 
               RETURNING id, email, display_name, avatar_url, bio, skills, created_at, updated_at`,
              [profile.id, profile.photos?.[0]?.value, email.toLowerCase()]
            );
            return done(null, updateResult.rows[0]);
          } else {
            // Create new user
            const insertResult = await query(
              `INSERT INTO users (email, display_name, avatar_url, google_id, email_verified) 
               VALUES ($1, $2, $3, $4, true) 
               RETURNING id, email, display_name, avatar_url, bio, skills, created_at, updated_at`,
              [
                email.toLowerCase(),
                profile.displayName || email.split('@')[0],
                profile.photos?.[0]?.value,
                profile.id
              ]
            );
            return done(null, insertResult.rows[0]);
          }
        } catch (error) {
          return done(error, false);
        }
      }
    ));
  }

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const result = await query(
        'SELECT id, email, display_name, avatar_url, bio, skills, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return done(null, false);
      }

      done(null, result.rows[0]);
    } catch (error) {
      done(error, false);
    }
  });
};