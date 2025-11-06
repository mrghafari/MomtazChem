import { Router } from 'express';
import passport from './passport-config';
import { db } from './db';
import { customers } from '@shared/customer-schema';
import { eq } from 'drizzle-orm';

const router = Router();

// =============================================================================
// GOOGLE OAUTH ROUTES
// =============================================================================

// Initiate Google OAuth login
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Always show account selection
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/customer/login?error=google_auth_failed' 
  }),
  (req, res) => {
    const user = req.user as any;
    
    console.log('✅ [GOOGLE CALLBACK] User authenticated:', {
      id: user.id,
      email: user.email,
      profileCompleted: user.profileCompleted
    });

    // Check if user needs to complete profile
    if (!user.profileCompleted) {
      console.log('🔄 [GOOGLE CALLBACK] Redirecting to profile completion');
      return res.redirect('/complete-profile');
    }

    // User has completed profile, redirect to dashboard
    console.log('✅ [GOOGLE CALLBACK] Profile complete, redirecting to dashboard');
    res.redirect('/customer-dashboard');
  }
);

// =============================================================================
// FACEBOOK OAUTH ROUTES
// =============================================================================

// Initiate Facebook OAuth login
router.get('/facebook',
  passport.authenticate('facebook', { 
    scope: ['email'],
    display: 'popup'
  })
);

// Facebook OAuth callback
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: '/customer/login?error=facebook_auth_failed' 
  }),
  (req, res) => {
    const user = req.user as any;
    
    console.log('✅ [FACEBOOK CALLBACK] User authenticated:', {
      id: user.id,
      email: user.email,
      profileCompleted: user.profileCompleted
    });

    // Check if user needs to complete profile
    if (!user.profileCompleted) {
      console.log('🔄 [FACEBOOK CALLBACK] Redirecting to profile completion');
      return res.redirect('/complete-profile');
    }

    // User has completed profile, redirect to dashboard
    console.log('✅ [FACEBOOK CALLBACK] Profile complete, redirecting to dashboard');
    res.redirect('/customer-dashboard');
  }
);

// =============================================================================
// PROFILE COMPLETION ROUTE
// =============================================================================

// Complete user profile after OAuth login
router.post('/complete-profile', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = req.user as any;
    const { phone, country, province, cityRegion, address, postalCode, whatsappNumber } = req.body;

    // Validate required fields
    if (!phone || !country || !province || !cityRegion || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phone, country, province, city, address'
      });
    }

    console.log('📝 [PROFILE COMPLETION] Updating user profile:', {
      userId: user.id,
      email: user.email
    });

    // Update user profile
    await db.update(customers)
      .set({
        phone,
        country,
        province,
        cityRegion,
        address,
        postalCode: postalCode || null,
        whatsappNumber: whatsappNumber || null,
        profileCompleted: true,
        updatedAt: new Date()
      })
      .where(eq(customers.id, user.id));

    console.log('✅ [PROFILE COMPLETION] Profile updated successfully');

    res.json({
      success: true,
      message: 'Profile completed successfully',
      profileCompleted: true
    });
  } catch (error) {
    console.error('❌ [PROFILE COMPLETION] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get current user profile completion status
router.get('/profile-status', (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      authenticated: false
    });
  }

  const user = req.user as any;
  res.json({
    success: true,
    authenticated: true,
    profileCompleted: user.profileCompleted || false,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      oauthProvider: user.oauthProvider
    }
  });
});

export default router;
