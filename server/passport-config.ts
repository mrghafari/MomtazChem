import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { db } from './db';
import { customers } from '@shared/customer-schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔐 [GOOGLE AUTH] User profile:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email provided by Google'), undefined);
      }

      // Check if user exists with this Google ID or email
      let user = await db.select()
        .from(customers)
        .where(
          or(
            eq(customers.googleId, profile.id),
            eq(customers.email, email)
          )
        )
        .limit(1);

      if (user.length > 0) {
        // Update Google ID if not set
        if (!user[0].googleId) {
          await db.update(customers)
            .set({
              googleId: profile.id,
              oauthProvider: 'google',
              avatarUrl: profile.photos?.[0]?.value,
              emailVerified: true,
              updatedAt: new Date()
            })
            .where(eq(customers.id, user[0].id));

          user[0] = {
            ...user[0],
            googleId: profile.id,
            oauthProvider: 'google',
            avatarUrl: profile.photos?.[0]?.value
          };
        }
        
        console.log('✅ [GOOGLE AUTH] Existing user logged in:', user[0].email);
        return done(null, user[0]);
      }

      // Create new user
      const names = profile.displayName?.split(' ') || ['', ''];
      const firstName = names[0] || 'User';
      const lastName = names.slice(1).join(' ') || '';

      // Generate a random password for OAuth users (they won't use it)
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      const [newUser] = await db.insert(customers)
        .values({
          email,
          passwordHash: randomPassword,
          firstName,
          lastName,
          googleId: profile.id,
          oauthProvider: 'google',
          avatarUrl: profile.photos?.[0]?.value,
          emailVerified: true,
          profileCompleted: false, // User needs to complete profile
          phone: '', // Will be completed later
          country: '', // Will be completed later
          province: '', // Will be completed later
          cityRegion: '', // Will be completed later
          address: '', // Will be completed later
          customerType: 'retail',
          customerStatus: 'active',
          customerSource: 'website'
        })
        .returning();

      console.log('✅ [GOOGLE AUTH] New user created:', newUser.email);
      return done(null, newUser);
    } catch (error) {
      console.error('❌ [GOOGLE AUTH] Error:', error);
      return done(error as Error, undefined);
    }
  }));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔐 [FACEBOOK AUTH] User profile:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email provided by Facebook'), undefined);
      }

      // Check if user exists with this Facebook ID or email
      let user = await db.select()
        .from(customers)
        .where(
          or(
            eq(customers.facebookId, profile.id),
            eq(customers.email, email)
          )
        )
        .limit(1);

      if (user.length > 0) {
        // Update Facebook ID if not set
        if (!user[0].facebookId) {
          await db.update(customers)
            .set({
              facebookId: profile.id,
              oauthProvider: 'facebook',
              avatarUrl: (profile.photos?.[0]?.value),
              emailVerified: true,
              updatedAt: new Date()
            })
            .where(eq(customers.id, user[0].id));

          user[0] = {
            ...user[0],
            facebookId: profile.id,
            oauthProvider: 'facebook',
            avatarUrl: profile.photos?.[0]?.value
          };
        }
        
        console.log('✅ [FACEBOOK AUTH] Existing user logged in:', user[0].email);
        return done(null, user[0]);
      }

      // Create new user
      const firstName = profile.name?.givenName || 'User';
      const lastName = profile.name?.familyName || '';

      // Generate a random password for OAuth users (they won't use it)
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      const [newUser] = await db.insert(customers)
        .values({
          email,
          passwordHash: randomPassword,
          firstName,
          lastName,
          facebookId: profile.id,
          oauthProvider: 'facebook',
          avatarUrl: profile.photos?.[0]?.value,
          emailVerified: true,
          profileCompleted: false, // User needs to complete profile
          phone: '', // Will be completed later
          country: '', // Will be completed later
          province: '', // Will be completed later
          cityRegion: '', // Will be completed later
          address: '', // Will be completed later
          customerType: 'retail',
          customerStatus: 'active',
          customerSource: 'website'
        })
        .returning();

      console.log('✅ [FACEBOOK AUTH] New user created:', newUser.email);
      return done(null, newUser);
    } catch (error) {
      console.error('❌ [FACEBOOK AUTH] Error:', error);
      return done(error as Error, undefined);
    }
  }));
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await db.select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);
    
    done(null, user[0] || null);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
