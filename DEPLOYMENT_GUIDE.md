# Deployment Guide for Momtaz Chemical Platform

## Domain Migration to www.momtazchem.com

This guide explains how to migrate the platform from Replit development environment to the production domain www.momtazchem.com.

### 1. Domain Configuration

The system uses a smart configuration system that automatically handles different domains:

#### Development (Current)
- Automatically detects Replit domain
- No configuration needed for development

#### Production (www.momtazchem.com)
Set the following environment variable:
```
FRONTEND_URL=https://www.momtazchem.com
```

### 2. Environment Variables for Production

Copy `.env.example` to `.env` and configure:

```bash
# Production Domain
FRONTEND_URL=https://www.momtazchem.com

# Database
DATABASE_URL=your_postgresql_connection_string

# Email Configuration
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=support@momtazchem.com
SMTP_PASS=your_smtp_password

# Session Security
SESSION_SECRET=generate_strong_random_key

# Environment
NODE_ENV=production
```

### 3. Email System Migration

All email communications will automatically use www.momtazchem.com:

- ✅ Password reset links
- ✅ Customer registration confirmations  
- ✅ Order notifications
- ✅ Inquiry responses
- ✅ SMS notifications

### 4. Deployment Platforms

The platform is 100% portable and can be deployed on:

#### Recommended Platforms:
1. **Vercel** (Recommended) - Automatic deployments
2. **Railway** - Simple database + app hosting  
3. **AWS Elastic Beanstalk** - Enterprise-grade
4. **Google Cloud Run** - Containerized deployment
5. **Heroku** - Git-based deployment
6. **DigitalOcean App Platform** - Cost-effective

### 5. Deployment Steps

#### For Vercel Deployment:
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy with build command: `npm run build`
4. Start command: `npm run start`

#### For Railway Deployment:
1. Connect repository to Railway
2. Add PostgreSQL database add-on
3. Configure environment variables
4. Deploy automatically

### 6. Database Migration

The system uses PostgreSQL and can be migrated to any provider:

- **Neon Database** (Current) → **Any PostgreSQL provider**
- Export current data using pg_dump
- Import to new database
- Update DATABASE_URL environment variable

### 7. Email Configuration

Update SMTP settings for production:

```javascript
// Current: Development SMTP
// Production: Use your domain's email server
SMTP_USER=support@momtazchem.com
SMTP_HOST=smtp.zoho.com // or your email provider
```

### 8. Testing Production Domain

Before going live:

1. Set FRONTEND_URL to www.momtazchem.com in test environment
2. Test password reset emails
3. Verify all links use correct domain
4. Test customer registration flow
5. Confirm email notifications work

### 9. DNS Configuration

Point www.momtazchem.com to your hosting platform:

```
Type: CNAME
Name: www
Value: your-deployment-url.vercel.app (or hosting platform URL)
```

### 10. SSL Certificate

Most modern hosting platforms (Vercel, Railway, etc.) provide automatic SSL:
- ✅ https://www.momtazchem.com will be automatically secured
- ✅ All email links will use https://

### 11. Post-Migration Checklist

After migration to www.momtazchem.com:

- [ ] Test customer registration
- [ ] Test password reset functionality  
- [ ] Verify email notifications
- [ ] Check all administrative functions
- [ ] Test order processing workflow
- [ ] Confirm SMS notifications work
- [ ] Verify SEO sitemap generation
- [ ] Test multilingual functionality

### 12. Rollback Plan

If issues occur:
1. Revert FRONTEND_URL to development domain
2. Update DNS if needed
3. System will automatically use fallback domain detection

### Contact Information

For deployment assistance:
- Technical documentation: Available in project files
- Email system: Fully configured and tested
- Database: Ready for migration
- Platform: 100% portable architecture

---

**Note**: The platform is designed to work seamlessly across all major hosting providers with minimal configuration changes. The smart domain detection ensures all links and communications automatically use the correct domain for each environment.