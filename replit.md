# Chemical Solutions Platform - Replit Project Guide

## Overview

This is a comprehensive chemical solutions e-commerce and management platform for Momtazchem, a leading chemical products company. The system combines a public-facing showcase website, e-commerce functionality, and robust administrative tools including CRM, inventory management, and email automation.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Internationalization**: Multi-language support (Persian, English, Arabic) with RTL/LTR text direction
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Session Management**: Express sessions with custom authentication
- **File Uploads**: Multer for handling product images and documents
- **Email Service**: Nodemailer with configurable SMTP providers (Zoho Mail primary)

### Database Architecture
- **Primary Database**: PostgreSQL 16 (Neon Database Cloud)
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migration System**: Drizzle Kit for schema migrations
- **Connection**: Neon serverless with connection pooling

## Key Components

### Schema Structure
The database is organized into multiple schema files:
- **Main Schema** (`shared/schema.ts`): Core CRM, admin system, and SEO management
- **Showcase Schema** (`shared/showcase-schema.ts`): Public website products and company info
- **Shop Schema** (`shared/shop-schema.ts`): E-commerce functionality with inventory management
- **Customer Schema** (`shared/customer-schema.ts`): Customer portal and order management
- **Email Schema** (`shared/email-schema.ts`): Email automation and template system

### Core Modules

#### Product Management
- **Showcase Products**: Display-only products for marketing purposes
- **Shop Products**: Full e-commerce products with pricing, inventory, and purchasing
- **Inventory System**: Stock tracking, low-stock alerts, and automated notifications
- **Category Management**: Hierarchical product categorization

#### Customer & CRM System
- **Customer Portal**: Self-service customer accounts with order history
- **CRM Integration**: Lead management, activity tracking, and sales pipeline
- **Order Management**: Complete order lifecycle from cart to fulfillment
- **Inquiry System**: Customer support and product inquiry management

#### Email Automation
- **Multi-SMTP Configuration**: Category-based email routing
- **Template System**: Customizable email templates with variable substitution
- **Automated Notifications**: Order confirmations, inventory alerts, customer communications
- **Recipient Management**: Role-based email distribution

#### Administrative Tools
- **User Management**: Multi-role admin system
- **Analytics Dashboard**: Sales reports, customer metrics, inventory analytics
- **SEO Management**: Multi-language SEO optimization with structured data
- **Document Management**: PDF generation, file uploads, and document storage

## Data Flow

### Customer Journey
1. **Discovery**: Browse showcase products on public website
2. **Inquiry**: Submit contact forms or product inquiries
3. **Registration**: Create customer account for purchasing
4. **Shopping**: Add products to cart, apply discounts
5. **Checkout**: Complete order with shipping and payment details
6. **Follow-up**: Receive automated emails, track order status

### Admin Operations
1. **Product Management**: Create/update products, manage inventory
2. **Order Processing**: Review orders, update status, track fulfillment
3. **Customer Support**: Respond to inquiries, manage customer relationships
4. **Analytics**: Monitor sales performance, inventory levels, customer metrics
5. **System Administration**: Manage users, configure email settings, backup data

### Email Automation Flow
1. **Trigger Events**: Order placement, low inventory, customer inquiries
2. **Category Routing**: Determine appropriate email category and SMTP configuration
3. **Template Processing**: Merge variables, apply personalization
4. **Delivery**: Send via configured SMTP provider with logging
5. **Tracking**: Monitor delivery status and recipient engagement

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL cloud service
- **Email Service**: Zoho Mail SMTP (configurable for other providers)
- **File Storage**: Local filesystem (upgradeable to cloud storage)
- **UI Components**: Radix UI primitives with Shadcn/ui styling

### Development Tools
- **Build System**: Vite for frontend bundling
- **Type Checking**: TypeScript with strict configuration
- **Database Tools**: Drizzle Kit for migrations and schema management
- **Process Management**: tsx for development server

### Third-Party Integrations
- **Payment Processing**: Stripe integration (configured but not fully implemented)
- **Live Chat**: Tawk.to widget for customer support
- **Analytics**: Ready for Google Analytics integration
- **PDF Generation**: Puppeteer for document generation

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: Neon Database cloud instance
- **Port Configuration**: 5000 (internal) → 80 (external)
- **Build Process**: Vite development server with hot module replacement

### Production Deployment
- **Build Command**: `npm run build` (Vite + esbuild bundling)
- **Start Command**: `npm run start` (production server)
- **Environment Variables**: Database URL, SMTP credentials, session secrets
- **Static Assets**: Served from `dist/public` directory

### Database Management
- **Backup Strategy**: Automated backup scripts with compression
- **Migration System**: Drizzle migrations for schema updates
- **Data Security**: Encrypted sensitive data, secure connection strings
- **Performance**: Connection pooling, query optimization

## Changelog

```
Changelog:
- June 26, 2025: COMPLETED database backup functionality migration to Site Management - moved database management from admin dashboard to centralized management interface
- June 26, 2025: Added database backup as fifth Quick Action button in Site Management with proper slate styling and Database icon
- June 26, 2025: Removed database backup button from main admin dashboard to continue centralizing administrative operations
- June 26, 2025: COMPLETED advanced email settings migration to Site Management - moved email configuration from admin dashboard to centralized management interface
- June 26, 2025: Added email settings as fourth Quick Action button in Site Management with proper emerald styling and Mail icon
- June 26, 2025: Removed advanced email settings button from main admin dashboard to continue centralizing administrative operations
- June 26, 2025: COMPLETED barcode functionality migration to Site Management - moved barcode inventory from admin dashboard to centralized management interface
- June 26, 2025: Added barcode as third Quick Action button in Site Management with proper cyan styling and QrCode icon
- June 26, 2025: Removed barcode button from main admin dashboard to continue centralizing administrative operations
- June 26, 2025: COMPLETED inquiries functionality migration to Site Management - moved inquiries from admin dashboard to centralized management interface
- June 26, 2025: Added inquiries as second Quick Action button in Site Management with proper orange styling and BarChart3 icon
- June 26, 2025: Removed inquiries button from main admin dashboard to further reduce clutter and centralize administrative operations
- June 26, 2025: COMPLETED Site Management centralization - moved sync shop functionality from admin dashboard to organized Site Management interface
- June 26, 2025: Created comprehensive Site Management page with 6 tabbed sections (Overview, Content, Users, Security, Performance, Settings)
- June 26, 2025: Integrated sync shop as primary function in Site Management with enhanced UI including loading animations and proper error handling
- June 26, 2025: Removed sync shop button from main admin dashboard to reduce clutter and centralize management functions
- June 26, 2025: Added Site Management navigation button in admin dashboard for easy access to centralized management tools
- June 26, 2025: COMPLETED comprehensive English localization of super admin settings interface
- June 26, 2025: Converted all Persian text to English including forms, labels, validation messages, navigation elements, buttons, status badges, and verification components
- June 26, 2025: Updated date formatting from Persian (fa-IR) to English (en-US) locale throughout admin interface
- June 26, 2025: Maintained full functionality while providing complete English language support for international users
- June 26, 2025: COMPLETED secure super admin verification system with email/SMS authentication
- June 26, 2025: Added comprehensive super admin management with password recovery functionality
- June 26, 2025: Implemented email and SMS verification codes for enhanced security
- June 26, 2025: Created super admin settings interface accessible from main admin dashboard
- June 26, 2025: Added verification token system with expiration and usage tracking
- June 26, 2025: Enhanced user schema with phone numbers and verification status fields
- June 26, 2025: FIXED admin login authentication to handle email-based login properly  
- June 26, 2025: Updated getUserByUsername method to support both username and email authentication
- June 26, 2025: Confirmed admin credentials: info@momtazchem.com / password working correctly
- June 26, 2025: COMPLETED comprehensive 3-department order management system (Financial, Warehouse, Logistics)
- June 26, 2025: Implemented sequential workflow where each department can only see orders approved by previous department
- June 26, 2025: Added automatic delivery code generation and SMS notification system for final delivery
- June 26, 2025: Created real-time order tracking with 30-second auto-refresh without page reload
- June 26, 2025: Built complete order status history tracking with department-specific notes
- June 26, 2025: Enhanced GPS location capture for customer addresses with high accuracy positioning
- June 26, 2025: Implemented proper workflow sequence validation to prevent unauthorized status changes
- June 25, 2025: FIXED SMS management authentication issues - admin can now toggle customer SMS settings
- June 25, 2025: Fixed API response structure for customer profile editing - removed customer.data vs customer.customer mismatch
- June 25, 2025: Enhanced authentication middleware to properly handle admin sessions for SMS management
- June 25, 2025: FIXED customer authentication system - registration and login now work seamlessly
- June 25, 2025: Added passwordHash field to CRM table for unified authentication across platforms
- June 25, 2025: Verified complete customer journey: registration → data storage → successful login
- June 25, 2025: Updated Tawk.to live chat script for enhanced customer support integration
- June 25, 2025: SUCCESSFULLY COMPLETED comprehensive CRM customer registration system
- June 25, 2025: Verified all 40+ customer data fields are properly stored in CRM database  
- June 25, 2025: Fixed TypeScript errors and confirmed data integrity in customer management
- June 25, 2025: Successfully integrated Tawk.to live chat widget for customer support
- June 25, 2025: COMPLETED unified CRM-Shop customer management integration
- June 25, 2025: Updated customer registration to create accounts directly in CRM with mandatory fields
- June 25, 2025: Enhanced customer login to authenticate primarily via CRM with legacy portal fallback
- June 25, 2025: Implemented automatic migration of legacy portal customers to CRM system
- June 25, 2025: Fixed customer information endpoints to prioritize CRM data over portal data
- June 25, 2025: Added comprehensive activity logging for all customer interactions in CRM
- June 25, 2025: FIXED frontend customer registration form to make phone, country, city, address mandatory fields
- June 25, 2025: Updated registration form validation to match CRM requirements with proper field marking
- June 25, 2025: COMPLETED full integration - registration API working perfectly with CRM
- June 25, 2025: Fixed duplicate key warning in shop page pagination and search functionality
- June 25, 2025: Successfully integrated advanced search system into main shop page
- June 25, 2025: Enhanced existing shop with comprehensive search filters (category, price, stock, tags, sorting)
- June 25, 2025: Added real-time search with debouncing, advanced filtering sidebar, and pagination
- June 25, 2025: Maintained existing cart functionality while upgrading search capabilities
- June 25, 2025: SUCCESSFULLY FIXED PDF export functionality - fully compatible with Adobe Acrobat
- June 25, 2025: Created new simplified PDF generator with proper Puppeteer API compatibility
- June 25, 2025: Analytics PDF export working (35KB files) and Customer PDF export working (46KB files)
- June 25, 2025: Fixed PDF export functionality for Adobe Acrobat compatibility - improved format validation
- June 25, 2025: Enhanced PDF generation with proper headers and format verification
- June 25, 2025: Updated Puppeteer configuration for better PDF compatibility
- June 25, 2025: Fixed PDF export functionality for customer reports - files now download and open properly
- June 25, 2025: Added missing PDF export API endpoints for individual customers and analytics
- June 25, 2025: Enhanced PDF generation with better error handling and data validation
- June 25, 2025: Implemented unified customer profile management across all platforms
- June 25, 2025: Created comprehensive customer profile component with tabbed interface
- June 25, 2025: Added customer profile API endpoints for unified data access
- June 25, 2025: Integrated unified profile into CRM and customer portal
- June 25, 2025: Enhanced customer profile with complete contact, business, and financial information
- June 25, 2025: Added real-time customer activity tracking and order history display
- June 25, 2025: Unified customer management - removed dual customer tables, CRM is now single source of truth
- June 25, 2025: Updated all customer endpoints to use CRM customers table exclusively
- June 25, 2025: Modified order creation to link directly to CRM customer IDs
- June 25, 2025: Enhanced customer login and registration to work with unified CRM system
- June 25, 2025: Made phone, country, city, and address mandatory fields in all registration forms
- June 25, 2025: Converted shop customer management to English with Gregorian dates and enhanced purchase info
- June 25, 2025: Updated CRM customer metrics calculation with real-time order data synchronization
- June 25, 2025: Changed currency formatting from IRR to USD across all customer interfaces
- June 25, 2025: Enhanced customer purchase information display with order details and payment methods
- June 25, 2025: Added validation for required fields in customer registration endpoints
- June 25, 2025: Converted CRM new customer form to English with enhanced fields (address, password)
- June 25, 2025: Converted CRM activities section to English language
- June 25, 2025: Removed manual testing functionality from SMTP Configuration & Validation section
- June 24, 2025: Changed CRM customer forms to English language and fixed customer purchase information display
- June 24, 2025: Added show/hide password functionality to all login and authentication forms
- June 24, 2025: Fixed admin and customer login systems with proper authentication
- June 24, 2025: Updated customer dashboard with real-time metrics calculation
- June 24, 2025: Implemented PDF export functionality for customer analytics and individual reports
- June 24, 2025: Changed customer list to use Gregorian dates instead of Persian dates
- June 24, 2025: Fixed customer metrics synchronization with order data
- June 24, 2025: Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```