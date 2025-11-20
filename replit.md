# Momtazchem Chemical Solutions Platform

## Overview
The Momtazchem Chemical Solutions Platform is a comprehensive, multilingual system integrating a public showcase website, e-commerce, and administrative tools for a chemical company. Its primary purpose is to optimize CRM, inventory, sales, logistics, and financial management while expanding market reach. Key capabilities include multi-language support (English, Arabic, Kurdish, Turkish), unified site management, advanced e-commerce, GPS tracking, real-time analytics, email automation, barcode and Kardex-synced inventory, and financial management. The project aims to establish Momtazchem as a digital leader in the chemical industry.

## Recent Changes (November 2025)
- **Procedures Management S3 Integration Complete (Nov 20, 2025)**:
  - Migrated all procedure documents and safety protocol documents to AWS S3 storage
  - Upload routes already using S3 (uploadPrivateFile) with files stored in 'procedure-documents' folder
  - Fixed download routes to stream files from S3 using getFileStream instead of local filesystem
  - Fixed delete routes to remove files from S3 using deleteFile instead of local filesystem
  - Updated uploadPrivateFile to return both 'key' and 'url' (url = key for private files)
  - Fixed duplicate function definitions in aws-s3-service.ts (uploadFile → uploadFileFromBuffer/uploadFileFromPath)
  - All procedure document operations (upload/download/delete) now fully integrated with AWS S3
  - System handles both procedures and safety protocols through unified S3 service
- **Product Image Optimistic Updates Fixed (Nov 20, 2025)**:
  - Implemented proper optimistic UI updates for product image deletion in kardex management
  - Images now immediately disappear from UI when delete button is clicked
  - Fixed by updating both form.setValue() AND setEditingProduct() to trigger useMemo recalculation
  - Applied same fix to Catalog PDF and MSDS PDF deletion for consistent user experience
  - displayImagePreviews now properly refreshes when editingProduct state changes
- **Critical Email Template System & AWS S3 Fixes (Nov 20, 2025)**:
  - **Fixed SQL Syntax Error**: Corrected `emailStorage.getTemplates()` method that was ordering by non-existent `templateName` field instead of `name`
  - Error was causing password reset emails to fail with "syntax error at end of input" at position 230
  - Password reset flow now working perfectly: email sending → token verification → password update
  - **AWS S3 Service Initialization Fixed**: Resolved issue where AWS S3 client wasn't initializing from encrypted database credentials
  - AWS S3 now properly decrypts stored credentials and initializes on server startup
  - Image uploads and S3 file serving routes now fully functional
- **AWS S3 Credentials Management with Encryption (Nov 20, 2025)**:
  - Implemented secure AWS S3 credentials management system with AES-256 encryption
  - Added encryption_key field to aws_s3_settings table (kept empty in database for security)
  - Encryption key stored in Replit Secrets (AWS_CREDENTIALS_ENCRYPTION_KEY) instead of database
  - Built admin interface at /admin/aws-s3-settings for secure credential management
  - All credentials (Access Key, Secret Key) encrypted before database storage using crypto module
  - Credentials displayed as masked (••••••••) in admin UI for security
  - Auto-migration disabled to prevent environment variables from overwriting manual database credentials
  - AWS S3 Service automatically initializes from encrypted database credentials on server startup
  - API endpoints: GET /api/admin/aws-s3/settings (masked), POST /api/admin/aws-s3/settings (auto-encrypts), POST /api/admin/aws-s3/test-connection
  - Current configuration: Access Key (AKIAYLLSZQTM4PTO2D4F), Region (eu-central-1), Bucket (momtazchem) - all encrypted in database
  - Security architecture follows best practices: encryption key never stored with encrypted data
- **OAuth Authentication Integration (Nov 6, 2025)**:
  - Integrated Google and Facebook OAuth login for customer accounts using Passport.js
  - Added database fields: google_id, facebook_id, oauth_provider, profile_completed, avatar_url to customers table
  - Created modular authentication system with dedicated server/auth-routes.ts module mounted at /api/auth
  - Built complete profile completion flow: OAuth → /complete-profile → /customer-dashboard
  - Implemented bilingual OAuth buttons (English/Arabic) on login page with LanguageContext integration
  - OAuth users must complete phone, country, province, city, and address before accessing customer portal
  - All redirect paths properly route to /customer/login for failed authentication and /customer-dashboard for successful login
  - Session-based authentication with automatic user creation/update on first OAuth login
  - **Setup Required**: Administrators need Google Cloud Console credentials (Client ID/Secret) and Facebook App credentials to activate OAuth login
- **Batch Management Multilingual Support (Nov 6, 2025)**:
  - Implemented full multilingual support for batch management page using LanguageContext
  - Added comprehensive translations to i18n.ts for English and Arabic
  - All batch-related UI elements now support both languages with proper RTL/LTR directionality
  - Translations include: page titles, search functionality, batch status indicators, production dates, and all data labels
  - Batch management page properly displays in the user's selected language with correct text direction
- **First Iraqi Bank (FIB) Online Payment Integration (Oct 30, 2025)**:
  - Integrated FIB payment gateway SDK (@first-iraqi-bank/sdk) for instant mobile app payments
  - Created comprehensive database schema (fib_payments, fib_payment_callbacks, fib_payment_settings tables)
  - Built backend service wrapper with OAuth2 authentication, payment creation, and status tracking
  - Implemented RESTful API routes: /api/fib/create-payment, /api/fib/payment-status/:id, /api/fib/payment-callback
  - Developed bilingual payment UI with QR code display, readable payment code, countdown timer, and real-time status polling
  - Added FIB payment method to system with highest priority (100) for optimal user experience
  - Supports all FIB mobile app ecosystems: Personal, Business, and Corporate
  - Environment-aware callback URL routing (production/staging/development) with fallback logic
  - Payment lifecycle management: pending → paid/cancelled/expired with automatic order status updates
- **Complete SEO Optimization Implementation (Oct 30, 2025)**:
  - Implemented comprehensive Product Schema (JSON-LD) with complete product information, pricing, ratings, and availability
  - Added Open Graph meta tags to all main pages (home, shop, about, contact) with absolute URLs for social media sharing
  - Created dynamic XML sitemap at /sitemap.xml including products, categories, static pages, and blog posts
  - Built full bilingual blog system with markdown editor, tag filtering, pagination, view tracking, and related posts
  - Added ArticleSchema component for blog post structured data with author, publisher, and article details
  - Implemented automatic document.title and meta description management via OpenGraphTags component
  - All SEO components follow Google's E-E-A-T principles with proper canonical URLs and breadcrumbs
- **Email Template System Cleanup (Oct 29, 2025)**: 
  - Fixed category statistics in email templates central page to show accurate counts based on database categories
  - Removed redundant template-numbering-system page and navigation button (18 templates already numbered with #01-#18 format)
  - Updated getCategoryStats function to use actual database categories instead of registry for accurate template counts
- **Shop Page Translation Completed**: Full bilingual implementation for Shop page filters, search, sorting and product display controls
  - Added comprehensive translation keys for filter sidebar (filters, search, sort by, categories, price range, availability)
  - Implemented RTL/LTR support for search icons and checkbox spacing
  - Added bilingual sort options (A-Z/Z-A, Low-High/High-Low, Newest, Relevance)
  - Translated product count display and pagination controls
  - All UI elements properly support both English and Arabic with professional typography

## User Preferences
Preferred communication style: Simple, everyday language.

Critical Security Requirements:
- Extreme vigilance in wallet transaction processing
- Always verify customer_id matches between orders and wallet transactions
- Never allow cross-customer wallet operations
- Implement quadruple verification for all payment corrections
- Maintain detailed audit trails for all financial operations

## System Architecture

### UI/UX Decisions
The platform features a professional, modern, and multilingual UI. It uses responsive design with Tailwind CSS and Shadcn/ui, adapting dynamically for RTL/LTR languages. Visual consistency is achieved through a unified design system, professional iconography (Lucide React), and smooth animations (Framer Motion). Color schemes denote status or categorize information. The administrative interface prioritizes intuitive design with drag-and-drop functionality and clear visual indicators.

### Technical Implementations
The system is built on a robust full-stack architecture with comprehensive security, including multi-level authentication, session management, password hashing (Bcrypt), and role-based access control. It integrates real-time capabilities for GPS tracking, inventory alerts, and order status. The platform supports dynamic multilingual content localization and adaptable UI layouts. Core business logic covers product management, order processing, customer relationship management, and logistics, with a strong focus on automation and data integrity. Key features include systematic auto-approval for payments, standardized geographical data, a vehicle template system for logistics, a hybrid payment system, a two-stage warehouse approval system, and FIFO (First-In, First-Out) batch management for inventory. All print functionality and relevant displays standardize Gregorian date formats. Product displays are filtered to show only products with active status, stock quantity > 0, valid SKU, barcode, and complete documentation (kardex, catalog, MSDS). A persistent customer cart system stores cart data across sessions and syncs with user authentication. The system implements comprehensive payment method support and gateway routing, ensuring proper routing and order number assignment upon payment confirmation. It also features intelligent contact form email routing based on product category, dynamic vehicle template integration, and a configurable global CC email system. Social media links and footer content are managed via the CMS for dynamic updates. Production reset functionality allows optional customer data preservation. Price range filters are optimized for user experience, and a robust order number assignment ensures consistent sequencing.

**Dynamic Grace Period Configuration (Updated Aug 2025)**: Grace period for bank transfer orders is now dynamically configurable through the shop_settings table. The system reads the 'proforma_deadline_days' setting with a fallback to 3 days default, allowing administrators to adjust grace periods without code changes.

### System Design Choices
The architecture emphasizes modularity and scalability, utilizing a RESTful API for backend-frontend communication and ensuring separation of concerns. Data integrity is maintained through transactional operations and a prevention-first approach. A unified vehicle selection algorithm prioritizes cost-efficiency and safety. Inventory management strictly adheres to FIFO principles. A comprehensive email and SMS automation system leverages templates and intelligent routing. The system is designed for continuous integration and deployment, with performance optimization through database indexing, caching, and asset optimization. Modals render directly in the component tree to avoid `removeChild` errors.

### Frontend Technology Stack
- React 18 with TypeScript
- Tailwind CSS
- Wouter
- TanStack Query (React Query)
- React Hook Form with Zod validation
- Shadcn/ui
- Lucide React
- Framer Motion

### Backend Technology Stack
- Node.js with Express.js
- TypeScript
- PostgreSQL (Neon Cloud)
- Drizzle ORM
- Express Sessions
- Bcrypt
- Multer
- Nodemailer
- SMS integration

### Database Schema
Key tables cover Customer Management, Order Processing, Product Catalog, Inventory, Logistics, Content Management, and User Management.

## External Dependencies

- **Database**: Neon PostgreSQL cloud service
- **Email Service**: Zoho Mail SMTP
- **SMS Services**: Iraqi operators (Asiacell, Zain Iraq, Korek Telecom) and international providers (Twilio, Plivo, Infobip, MSG91)
- **Payment Processing**: First Iraqi Bank (FIB) Online Payment Gateway, Iraqi banks (Rasheed Bank, Al-Rafidain Bank, Trade Bank of Iraq)
- **AI Services**: OpenAI API (for SKU generation, product recommendations)
- **Live Chat**: Tawk.to
- **PDF Generation**: Puppeteer, PDFKit/pdfMake
- **Barcode Generation**: GS1-compliant EAN-13 barcode system
- **Remote Desktop**: RustDesk, TeamViewer, AnyDesk, Chrome Remote Desktop, Microsoft RDP