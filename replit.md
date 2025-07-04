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
- July 4, 2025: COMPLETED centralized category standardization - updated all forms and website sections to use standardized shop categories from database (Water Treatment, Fuel Additives, Paint & Solvents, Agricultural Products, Agricultural Fertilizers, Industrial Chemicals, Paint Thinner, Technical Equipment, Commercial Goods), synchronized contact form dropdown, header navigation menus, product pages, product registration form, and email routing system to ensure consistent category usage across entire platform
- July 4, 2025: COMPLETED barcode display optimization - removed duplicate product information display in barcode inventory table, now VisualBarcode component handles all product details (name, SKU) display and ensures they appear in print/download outputs without redundant text in interface
- July 4, 2025: FIXED duplicate barcode display issue - removed redundant "بارکد نموداری" column from EAN-13 products table, consolidated barcode display to show both clickable code and visual barcode in single "Current Barcode" column, eliminated duplicate graphical barcode rendering that was showing twice per product row
- July 4, 2025: COMPLETED centralized refresh system integration - removed individual RefreshControl components from all 4 order management sections (Finance, Warehouse, Logistics, Delivered Orders), all departments now follow centralized Global Refresh Settings from Site Management, eliminated duplicate refresh controls in favor of unified system-wide refresh management, fixed delivered orders API import issues to ensure proper functionality across all order management workflows
- July 4, 2025: REMOVED delivered orders management button from Site Management interface per user request - cleaned up Quick Actions panel by removing 25th button with CheckCircle icon, delivered orders functionality remains available through direct navigation for logistics and super admin users
- July 4, 2025: COMPLETED dynamic workflow implementation - orders automatically removed from each department after approval and moved to next stage, Finance sees only payment_uploaded orders, Warehouse sees only financial_approved orders, Logistics sees only warehouse_approved orders, implemented delivered orders page with strict access control (logistics + super admin only)
- July 4, 2025: ENHANCED refresh system to follow global settings control - connected all three department order pages (Finance, Warehouse, Logistics) to centralized Global Refresh Settings instead of hardcoded 10-minute intervals, auto-refresh now reads settings from localStorage including syncEnabled mode for unified timing across departments and individual interval settings when sync is disabled, eliminates authentication errors by loading data first then starting controlled refresh based on admin-configured intervals from Site Management
- July 4, 2025: COMPLETED centralized refresh control system - created RefreshControl component with automatic timer functionality and proper Persian interface, integrated RefreshControl into all three department order management pages (Finance, Warehouse, Logistics) replacing individual refresh buttons, built comprehensive global-refresh-settings page for centralized admin control over all department refresh intervals with sync/individual modes, added global refresh settings as 24th Quick Action button in Site Management with indigo styling and RefreshCw icon, implemented localStorage-based settings persistence ensuring admin can control refresh timing for entire organization from single interface
- July 3, 2025: COMPLETED comprehensive AI Settings management panel - created dedicated AI configuration interface in Site Management as 23rd Quick Action button with purple Zap icon, implemented complete AI settings page with 4 tabbed sections (General Settings, SKU Generation, Performance, Testing), added OpenAI API connection testing, SKU generation testing, performance monitoring with token usage tracking, system logs display, and comprehensive configuration options for AI model parameters (gpt-4o, max tokens, temperature), enhanced admin interface with AI system status monitoring and real-time performance metrics
- July 3, 2025: CORRECTED Iraq country code from 846 to 864 - updated all barcode generation functions to use correct GS1 country code for Iraq (864), cleared all existing barcodes from database (14 showcase + 11 shop products) to regenerate with correct format, new barcode format is now: 864-96771-XXXXX-C for accurate GS1 compliance, maintained all existing barcode generation infrastructure with only country code correction
- July 3, 2025: COMPLETED new structured EAN-13 barcode system implementation - migrated all existing products to new format using Iraq country code (initially 846, corrected to 864), Momtazchem company code (96771), and unique 5-digit product codes, successfully updated all 15 existing showcase products with new structured barcodes, implemented API endpoint for checking 5-digit product code uniqueness (/api/barcode/check-product-code), enhanced barcode generation utilities to use random unique product codes instead of hash-based generation, all barcodes now follow strict format: 864-96771-XXXXX-C for professional retail distribution compliance
- July 3, 2025: COMPLETED batch barcode generation system for existing products - implemented comprehensive API endpoints (/api/barcode/batch-generate, /api/barcode/regenerate-all) for bulk barcode creation, added server-side batch processing functionality with detailed success/failure reporting, integrated Persian-language batch generation button in admin barcode inventory interface enabling one-click barcode creation for all existing products without barcodes, enhanced barcode generation debugging with step-by-step validation and error handling
- July 3, 2025: COMPLETED click-to-copy barcode functionality - enhanced barcode display with intuitive click-to-copy interface, users can now click directly on barcode number to copy to clipboard, added visual feedback with hover effects and copy confirmation notifications, replaced separate copy button with seamless one-click experience including helpful tooltip and instruction text
- July 3, 2025: ENHANCED barcode protection system - implemented barcode protection in product form preventing overwriting of existing barcodes, added validation checks that require clearing existing barcode field before generating new one, updated user interface with warning message about barcode protection, ensuring data integrity and preventing accidental barcode changes that could affect product tracking and inventory management
- July 3, 2025: COMPLETED centralized barcode management system - migrated all barcode operations to shared/barcode-utils.ts ensuring consistent EAN-13 generation across entire system, updated products.tsx and ean13-generator.tsx to use centralized utilities, added comprehensive API endpoints (/api/barcode/generate, /api/barcode/validate, /api/barcode/product/:id, /api/barcode/search/:barcode) for system-wide barcode management, eliminated duplicate barcode generation logic in favor of single source of truth with product name hash for consistent barcode-to-product mapping
- July 3, 2025: COMPLETED full Product Variants integration into main Products page - removed separate Product Variants button from Site Management as variant functionality now fully integrated within main Products management interface, variants handled as new products with parent-child relationships, added variant fields (is_variant, parent_product_id, variant_type, variant_value) to showcase schema, created parent product selector and variant type controls in product form, implemented variant display section showing related variants grouped under parent products
- July 3, 2025: COMPLETED comprehensive GS1-compliant EAN-13 barcode system implementation - created professional EAN-13 generator component with proper GS1 country codes (Iraq: 864-865), automatic checksum calculation, and validation, built comprehensive EAN-13 management interface with product status tracking, bulk generation capabilities, CSV export functionality, integrated with existing barcode infrastructure, added complete backend API endpoints for EAN-13 validation and management, successfully integrated into Site Management as 22nd Quick Action button for retail distribution readiness
- July 3, 2025: COMPLETED three-language system integration for customer profile functionality - comprehensive customer profile translation keys in i18n system for English/Arabic/Kurdish, successfully integrated language context into main customer profile page, updated customer profile edit page with three-language support and proper RTL/LTR text direction, eliminated Persian/Farsi dependency from customer profile interfaces, maintaining automatic analytics system scalability with dynamic product inclusion
- July 2, 2025: COMPLETED comprehensive analytics system implementation - fixed all SQL query syntax errors in analytics API endpoints, converted all queries to proper Drizzle SQL template syntax, resolved parameter binding issues, implemented working geographic analytics, product performance tracking, and time series data visualization with complete test data across Iraq (9 cities) and Turkey (8 cities) showing detailed product sales by region with revenue breakdowns
- July 2, 2025: CONVERTED geographic analytics interface to English - updated all Persian/Farsi translations to English, removed RTL text direction support to use standard left-to-right layout, geographic analytics system now displays in English with professional terminology for regional sales tracking, product performance analysis, and time series data visualization
- June 28, 2025: COMPLETED About page multilingual integration - transformed entire About page to follow site's selected language (English/Arabic/Kurdish), added comprehensive translations for all sections including company story, mission/vision, core values, team statistics, and certifications, implemented proper RTL/LTR text direction support with intelligent icon and layout positioning, About page content now dynamically displays in user's chosen language maintaining beautiful typography and proper text flow
- June 28, 2025: ADDED Kurdish language support with beautiful fonts - extended language system to include Kurdish (کوردی) alongside English and Arabic, implemented professional Kurdish translations for all interface elements including navigation, forms, wallet, and product categories, integrated Google Fonts for optimal Arabic/Kurdish typography (Noto Sans Arabic, Amiri, Scheherazade New), enhanced font rendering with proper ligatures and text smoothing, updated language switcher with Kurdish flag and three-language cycling functionality
- June 28, 2025: ENHANCED header customer display - updated both desktop and mobile navigation to prominently show customer's full name in a distinctive badge style, replaced simple user icon with clear name display in gray/blue background, maintained dropdown functionality for profile access while making user identity more visible and accessible
- June 28, 2025: COMPLETED customer wallet centralized language integration - removed separate bilingual translation system from wallet component, integrated wallet translations into main i18n system, wallet now seamlessly follows site's English/Arabic language setting with automatic RTL/LTR text direction support, eliminated redundant language switcher from wallet interface for consistent user experience
- June 27, 2025: REMOVED customer name display from header - cleaned up header interface by removing redundant customer name display from both desktop and mobile navigation menus, now only showing user icon and dropdown menu since wallet system provides comprehensive customer information access
- June 27, 2025: COMPLETED customer dropdown menu localization - updated header navigation to follow site's original language setting instead of hardcoded Persian text, added proper bilingual support for profile, wallet, and logout menu items in both desktop and mobile interfaces, integrated translations with existing i18n system for consistent language switching experience across entire application
- June 27, 2025: COMPLETED comprehensive Iraqi banking payment gateway system - implemented complete payment infrastructure with three major Iraqi banks (Rasheed Bank, Al-Rafidain Bank, Trade Bank of Iraq), created admin payment settings management in Site Management, added payment_method and payment_gateway_id fields to orders schema, built specialized APIs for Iraqi bank transfer processing and admin payment confirmation, integrated automatic invoice generation after payment approval, tested full workflow from payment gateway creation to invoice delivery with real banking details and SWIFT codes
- June 27, 2025: MOVED invoice management under shop management section - reorganized admin interface by integrating invoice management as sixth tab within shop management interface, created comprehensive InvoiceManagementTab component with full statistics dashboard, invoice table with download/payment/official processing capabilities, maintains all existing functionality while providing better administrative organization and workflow efficiency
- June 27, 2025: COMPLETED downloadable invoice PDF system - implemented full PDF generation and download functionality for customers and admins, added `/api/invoices/:id/download` endpoint with Puppeteer-based PDF generation, created bilingual PDF templates that dynamically display content in Arabic or English based on customer's language preference, enabled automatic PDF downloads with proper filename handling, integrated download buttons in both checkout success page and admin invoice management dashboard
- June 27, 2025: IMPLEMENTED multi-language invoice system - added language selection (Arabic/English) for official invoices during checkout process, customers can now choose their preferred invoice language when requesting official invoices, enhanced invoice database schema with language field (defaults to Arabic), updated checkout success page with bilingual language selection modal, modified invoice storage and API routes to handle language parameter properly
- June 27, 2025: OPTIMIZED shop print reports for essential content only - removed unnecessary sections including charts, decorative elements, interactive buttons, and summary cards from print output, implemented compact table styling with smaller fonts and spacing, added print-only summary box showing key metrics, enhanced print styles to focus on core sales data and product details for cleaner professional reports
- June 27, 2025: IMPLEMENTED automatic discount description synchronization - when admin updates discount percentage, the description field automatically updates to reflect the new percentage value in Persian format, ensuring consistency between discount settings and displayed descriptions across the system
- June 27, 2025: COMPLETED discount system real-time synchronization - modified shop products API to include live discount data from discount_settings table, enhanced search API with discount information, added frontend cache invalidation to ensure discount changes immediately appear on product cards
- June 27, 2025: FIXED guest checkout authentication flow - resolved issue where users entering as guest then logging in with existing credentials would see empty registration form instead of loading user data, implemented intelligent profile completion detection that checks for missing required fields (phone, country, city, address) and pre-fills registration form with existing customer data when profile completion is needed, added customer update API endpoint for seamless profile completion during checkout flow
- June 27, 2025: COMPLETED independent CC/BCC recipient management system - added dedicated quick-add interface for independent CC and BCC email addresses, implemented visual distribution summary showing current TO/CC/BCC configuration per category, enhanced admin interface with color-coded recipient type badges, and upgraded email sending logic to properly handle separate recipient lists while maintaining smart CC monitoring for centralized oversight
- June 27, 2025: ENHANCED email system with full CC/BCC recipient type support - implemented comprehensive recipient type management (TO, CC, BCC) throughout all email functions, updated database schema with recipientType field, enhanced admin interface to display and configure recipient types with color-coded badges, and upgraded email sending logic to properly separate and handle different recipient types while maintaining smart CC monitoring for info@momtazchem.com
- June 27, 2025: COMPLETELY RESOLVED sender/recipient duplicate email issue - implemented comprehensive protection across ALL email functions (contact forms, product inquiries, password resets, quote requests, inventory alerts) with advanced skip logic, recipient filtering, UTF-8 encoding, and smart CC functionality to prevent all SMTP "550 Invalid Recipients" errors when sender and recipient are the same email address
- June 27, 2025: FIXED SMTP relay issue - resolved "553 Relaying disallowed as noreply@momtazchem.com" error by updating email system to use only authenticated sender addresses from existing Zoho Mail configuration, ensuring all emails send successfully
- June 27, 2025: COMPLETED comprehensive Email Control Panel in Advanced Email Settings - added dedicated admin interface with full oversight of CC monitoring, intelligent routing configuration, system status, and quick action buttons for email management
- June 27, 2025: IMPLEMENTED intelligent centralized email monitoring - ALL emails now automatically route to info@momtazchem.com either as recipients or smart CC, preventing duplicates while ensuring comprehensive oversight (contact forms, product inquiries, password resets, quote requests)
- June 27, 2025: COMPLETED intelligent email routing system - contact forms now automatically route to appropriate departments based on product category selection (fuel-additives→Fuel Dept, water-treatment→Water Dept, paint-thinner→Paint Dept, agricultural-fertilizers→Agricultural Dept, other→Support, custom-solutions→Sales)
- June 27, 2025: ENHANCED email system with professional confirmation emails, automatic fallback to admin category when department not configured, and comprehensive email logging with routing statistics
- June 27, 2025: ADDED Email Routing Statistics dashboard showing routing map, category performance metrics, success rates, and recent email activity with real-time monitoring
- June 27, 2025: FIXED SMTP validation consistency - unified Test Connection button in Advanced Email Settings to use the same reliable validation system as SMTP Test tool, eliminating false positive results and ensuring proper authentication testing
- June 27, 2025: UPDATED email category names - changed "Order Processing" to "Sales department" and "System Notifications" to "Support" in database to better reflect actual functionality
- June 27, 2025: COMPLETED "Other Products" category implementation - changed from Persian to English, created comprehensive product page with 6 fake chemical products including industrial degreasers, corrosion inhibitors, laboratory reagents, specialty solvents, concrete additives, and textile processing chemicals
- June 27, 2025: ENHANCED product categorization system - added "Other Products" as 5th category across contact form dropdown, header navigation menu, and products page tabs with proper English labeling
- June 26, 2025: FIXED super admin list display issue - updated user department settings so both super admins appear in the management interface
- June 26, 2025: ENHANCED admin password reset email functionality to actually send emails via SMTP instead of only logging to console
- June 26, 2025: UPDATED email system to use super admin's email for all administrative communications
- June 26, 2025: FIXED super admin form initialization - moved eye icons to right side and ensured form fields are completely empty on component mount
- June 26, 2025: Enhanced super admin settings with proper form clearing functionality and improved password field positioning
- June 26, 2025: Modified password fields layout to be vertically stacked (password and confirm password now appear one below the other)
- June 26, 2025: COMPLETED bilingual conversion of user-management page to English/Arabic with English as default language and RTL/LTR support
- June 26, 2025: SET Iraqi Dinar (IQD) as default currency across all forms and formatCurrency functions throughout the application
- June 26, 2025: Updated default currency in product forms, sales analytics, sales reports, CRM, and unified customer profile components
- June 26, 2025: FIXED unit price persistence issue - added unitPrice and currency fields to showcase schema with proper database column creation
- June 26, 2025: Enhanced product form to properly handle unit price and currency data with correct form initialization and data conversion
- June 26, 2025: Verified database connection and confirmed unit price updates are being stored correctly in PostgreSQL
- June 26, 2025: RESOLVED unit price validation error - implemented proper data type conversion in form submission handler
- June 26, 2025: COMPLETED comprehensive currency standardization - replaced Iranian Rial (IRR) with Iraqi Dinar (IQD) throughout entire application
- June 26, 2025: Updated all currency selection forms to use only USD, EUR, and IQD as valid currencies
- June 26, 2025: Enhanced formatCurrency functions across all components to support multiple currencies with validation
- June 26, 2025: Standardized product management, CRM, sales analytics, and customer interfaces to new currency system
- June 26, 2025: COMPLETED final administrative centralization - removed Products button from admin dashboard as it's fully integrated into Site Management
- June 26, 2025: Admin dashboard now contains only Site Management button providing access to all 17 administrative functions including product management
- June 26, 2025: Updated admin dashboard welcome message to reflect complete centralization of all administrative tools
- June 26, 2025: COMPLETED administrative dashboard restructuring - moved all product management from admin dashboard to dedicated /admin/products page
- June 26, 2025: Streamlined admin dashboard to contain only Site Management and Products navigation buttons for clean, focused interface
- June 26, 2025: Added proper routing for /admin/products with full product catalog management capabilities
- June 26, 2025: Added Products as 17th Quick Action button to Site Management with violet styling and Box icon for future product management functionality
- June 26, 2025: COMPLETED Order Management migration to Site Management - moved three-department order workflow system to centralized interface
- June 26, 2025: Added Order Management as 16th Quick Action button with orange styling and Truck icon for Finance→Warehouse→Logistics workflow
- June 26, 2025: Removed Order Management button from main admin dashboard to complete administrative centralization
- June 26, 2025: COMPLETED comprehensive administrative centralization - moved ALL remaining functions to Site Management
- June 26, 2025: Added Procedures & Methods as 14th Quick Action button with amber styling and BookOpen icon for document management
- June 26, 2025: Added SMTP Test as 15th Quick Action button with sky styling and TestTube icon for email testing functionality
- June 26, 2025: Removed Procedures & Methods and SMTP Test buttons from main admin dashboard to achieve complete centralization
- June 26, 2025: COMPLETED shop functionality migration to Site Management - moved e-commerce administration from admin dashboard to centralized management interface
- June 26, 2025: Added shop as thirteenth Quick Action button in Site Management with proper purple styling and DollarSign icon
- June 26, 2025: Removed shop button from main admin dashboard to continue administrative centralization
- June 26, 2025: COMPLETED user management functionality migration to Site Management - moved admin user and role management from admin dashboard to centralized management interface
- June 26, 2025: Added user management as twelfth Quick Action button in Site Management with proper red styling and Users2 icon
- June 26, 2025: Removed user management button from main admin dashboard to continue administrative centralization
- June 26, 2025: COMPLETED super admin settings functionality migration to Site Management - moved admin account management and verification system from admin dashboard to centralized management interface
- June 26, 2025: Added super admin settings as eleventh Quick Action button in Site Management with proper indigo styling and UserCog icon
- June 26, 2025: Removed super admin settings button from main admin dashboard to continue administrative centralization
- June 26, 2025: COMPLETED factory management functionality migration to Site Management - moved production line and manufacturing operations from admin dashboard to centralized management interface
- June 26, 2025: Added factory management as tenth Quick Action button in Site Management with proper purple styling and Factory icon
- June 26, 2025: Removed factory management button from main admin dashboard to continue administrative centralization
- June 26, 2025: COMPLETED SMS management functionality migration to Site Management - moved SMS customer communication settings from admin dashboard to centralized management interface
- June 26, 2025: Added SMS management as ninth Quick Action button in Site Management with proper green styling and MessageSquare icon
- June 26, 2025: Removed SMS management button from main admin dashboard to complete centralization of administrative operations
- June 26, 2025: COMPLETED category management functionality migration to Site Management - moved category management from admin dashboard to centralized management interface
- June 26, 2025: Added category management as eighth Quick Action button in Site Management with proper blue styling and Package icon
- June 26, 2025: Removed category management button from main admin dashboard to continue centralizing administrative operations
- June 26, 2025: COMPLETED SEO functionality migration to Site Management - moved multilingual SEO management from admin dashboard to centralized management interface
- June 26, 2025: Added SEO as seventh Quick Action button in Site Management with proper purple styling and Globe icon
- June 26, 2025: Removed SEO button from main admin dashboard to continue centralizing administrative operations
- June 26, 2025: COMPLETED CRM functionality migration to Site Management - moved customer relationship management from admin dashboard to centralized management interface
- June 26, 2025: Added CRM as sixth Quick Action button in Site Management with proper pink styling and Users icon
- June 26, 2025: Removed CRM button from main admin dashboard to continue centralizing administrative operations
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