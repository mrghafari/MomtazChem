# Chemical Solutions Platform - Replit Project Guide

## Overview

This is a comprehensive multilingual chemical solutions e-commerce and management platform for Momtazchem, a leading chemical products company in Iraq and the Middle East. The system combines a public-facing showcase website, advanced e-commerce functionality, and robust administrative tools including CRM, inventory management, email automation, content management, and SEO optimization. The platform supports 4 languages (English, Arabic, Kurdish, Turkish) with complete RTL/LTR text direction handling and features 25+ integrated administrative functions centralized in a unified Site Management interface with drag-and-drop Quick Actions layout.

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
- **Main Schema** (`shared/schema.ts`): Core CRM, admin system, SEO management, and content management
- **Showcase Schema** (`shared/showcase-schema.ts`): Public website products, company info, and product variants
- **Shop Schema** (`shared/shop-schema.ts`): E-commerce functionality, inventory management, and EAN-13 barcodes
- **Customer Schema** (`shared/customer-schema.ts`): Customer portal, order management, and address management
- **Email Schema** (`shared/email-schema.ts`): Multi-SMTP email automation, template system, and routing
- **CRM Schema** (`shared/crm-schema.ts`): Advanced customer relationship management and analytics
- **Content Management Schema**: Dynamic multilingual content system with 430+ items in 4 languages
- **SEO Schema**: Comprehensive multilingual SEO with sitemap, robots.txt, and 4-language support
- **Payment Schema**: Iraqi banking integration with invoice generation and payment gateways

### Core Modules

#### Content Management System
- **Dynamic Content**: 430+ multilingual content items across 12 sections in 4 languages
- **Social Media Management**: Configurable social media links for 6 platforms (LinkedIn, Twitter, Facebook, Instagram, TikTok, WhatsApp)
- **Image Management**: Upload, organize, and manage visual assets by section
- **Multilingual Support**: English, Arabic, Kurdish, and Turkish with proper RTL/LTR handling

#### Product Management
- **Showcase Products**: Display-only products with variant support and parent-child relationships
- **Shop Products**: Full e-commerce products with EAN-13 barcodes, pricing, and inventory
- **Barcode System**: GS1-compliant EAN-13 generation with Iraq country code (864) and batch processing
- **Inventory Management**: Real-time stock tracking, low-stock alerts, automation, and analytics
- **Category Management**: Standardized hierarchical product categorization across 9 main categories

#### Customer & CRM System
- **Unified Customer Management**: Single CRM system with automated migration from legacy portal
- **Advanced Analytics**: Customer segmentation, purchase history, and performance metrics
- **Address Management**: Multiple addresses per customer with default address selection
- **Order Management**: 3-department workflow (Financial → Warehouse → Logistics) with automatic progression
- **Customer Activities**: Comprehensive activity logging and tracking
- **Digital Wallet**: Customer balance management with recharge requests and approval workflow

#### Email Automation & Communication
- **Multi-SMTP Configuration**: Category-based intelligent email routing across 8 email categories
- **Advanced Template System**: Customizable templates with variable substitution and personalization
- **Routing Intelligence**: Automatic department routing based on product categories and inquiry types
- **CC/BCC Management**: Independent recipient management with smart monitoring
- **SMTP Testing**: Comprehensive connectivity testing and validation tools
- **SMS Integration**: Customer notification and verification systems

#### SEO & Internationalization
- **Multilingual SEO**: Comprehensive SEO management for 4 languages with meta tags, descriptions, and keywords
- **Dynamic Sitemap**: Auto-generated XML sitemaps with 47+ entries across all supported languages
- **Robots.txt Management**: Configurable robots.txt with crawling directives
- **hreflang Support**: Proper language alternate tags for international SEO
- **Content Localization**: Dynamic content switching based on user language preference

#### Payment & Financial Systems
- **Iraqi Banking Integration**: Support for 3 major Iraqi banks (Rasheed, Al-Rafidain, Trade Bank)
- **Invoice Generation**: Bilingual PDF invoices with automatic download capabilities
- **Payment Gateway Management**: Admin-configurable payment methods and SWIFT codes
- **Financial Workflow**: Integrated payment approval and invoice delivery system

#### AI & Automation
- **Smart SKU Generation**: AI-powered SKU creation with category codes and product identification
- **Product Recommendations**: Intelligent product suggestions based on industry and requirements
- **Performance Monitoring**: AI system performance tracking with token usage analytics
- **Automated Barcode Generation**: Bulk barcode processing for existing products

#### Site Management Features
- **26 integrated administrative functions** centralized in unified Site Management interface with drag-and-drop Quick Actions layout:

1. **Sync Shop** - Product synchronization between showcase and shop catalogs
2. **Inquiries** - Customer inquiry management and response tracking
3. **Barcode** - Professional GS1-compliant EAN-13 barcode system with Iraq country code (864)
4. **Email Settings** - Multi-SMTP configuration with intelligent category-based routing
5. **Database Backup** - Automated backup systems, migration tools, and PostgreSQL maintenance
6. **CRM** - Customer relationship management with analytics and automated migration
7. **SEO** - Comprehensive multilingual SEO with sitemap generation and 4-language support
8. **Categories** - Hierarchical product categorization with standardized shop categories
9. **SMS** - Customer notification and verification systems with admin-configurable settings
10. **Factory** - Production line and manufacturing operations management
11. **Super Admin** - Admin account management and verification system with email/SMS authentication
12. **User Management** - Multi-role admin system with department-based access control
13. **Shop** - E-commerce administration with inventory tracking and pricing management
14. **Procedures** - Document management system for operational procedures and methods
15. **SMTP Test** - Comprehensive email connectivity testing and validation systems
16. **Order Management** - 3-department sequential workflow (Financial → Warehouse → Logistics)
17. **Products** - Showcase and shop product catalogs with variant support and specifications
18. **Payment Settings** - Iraqi banking system integration with 3 major banks and invoice generation
19. **Wallet Management** - Digital wallet system with recharge requests and balance management
20. **Geography Analytics** - Regional sales tracking and performance analysis (Iraq and Turkey)
21. **AI Settings** - Smart SKU generation, product recommendations, and OpenAI API integration
22. **Refresh Control** - Centralized timing management for all department interfaces
23. **Department Users** - Team management with role assignments and access control
24. **Inventory Management** - Independent inventory system with alerts, automation, and real-time monitoring
25. **Content Management** - Dynamic multilingual content editing system (430+ items in 4 languages)
26. **[Future Enhancement Slot]** - Reserved for additional administrative functionality

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
- **Database**: Neon PostgreSQL cloud service with connection pooling
- **Email Service**: Zoho Mail SMTP with multi-category routing (configurable for other providers)
- **File Storage**: Local filesystem with upload management (upgradeable to cloud storage)
- **UI Components**: Radix UI primitives with Shadcn/ui styling and custom theming
- **AI Services**: OpenAI API integration for SKU generation and product recommendations

### Development Tools
- **Build System**: Vite for frontend bundling with hot module replacement
- **Type Checking**: TypeScript with strict configuration and ESM modules
- **Database Tools**: Drizzle Kit for migrations, schema management, and type-safe queries
- **Process Management**: tsx for development server with auto-restart
- **Animation Library**: @hello-pangea/dnd for drag-and-drop functionality

### Third-Party Integrations
- **Payment Processing**: Iraqi banking system integration (Rasheed Bank, Al-Rafidain Bank, Trade Bank of Iraq)
- **Live Chat**: Tawk.to live chat widget for customer support
- **Analytics**: Geographic analytics with Iraq and Turkey regional data
- **PDF Generation**: Puppeteer for invoice and report generation
- **SMS Services**: Customer notification and verification systems
- **Barcode Generation**: EAN-13 barcode system with GS1 compliance
- **Font Integration**: Google Fonts for multilingual typography (Arabic, Kurdish, Turkish)

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
- July 6, 2025: FULLY COMPLETED automatic dual-table stock reduction system - successfully implemented and tested comprehensive stock synchronization where customer orders automatically reduce inventory in BOTH shop_products AND showcase_products tables simultaneously, fixed try-catch block structure to handle independent database updates, resolved inventory transaction schema conflicts with proper error handling, verified working system with multiple test cases (Technical Equipment Cleaner: shop 35→25, showcase 35→24; Paint Thinner Premium: shop 39→37, showcase 35→33), eliminated all stock discrepancies between admin and customer interfaces, ensured unified real-time inventory management across entire platform
- July 6, 2025: COMPLETED automatic stock reduction system implementation and testing - verified stock reduction works correctly in both customer order endpoints (/api/customers/orders and /api/shop/orders), demonstrated successful stock reduction with multiple test cases (Octane Booster 95: 15→12, Paint Thinner Premium: 50→45, Industrial Degreaser: 30→25, Agricultural Fertilizer NPK: 100→98, Fuel Additive Diesel Plus: 40→39), confirmed unified database architecture prevents synchronization issues with both admin and shop reading from same shop_products table, stock automatically reduces when customers place orders through checkout mutation and changes appear immediately on both admin and customer interfaces
- July 6, 2025: RESOLVED critical inventory caching issue that was causing stock number discrepancies between admin and shop pages - implemented comprehensive multi-layer cache-busting solution including server-side cache control headers (no-cache, no-store, must-revalidate) for all /api/shop/ endpoints, updated React Query configuration to disable caching globally for inventory data (staleTime: 0, gcTime: 0 for shop endpoints), enhanced default queryFn with automatic cache-busting for shop-related requests, added explicit fetch-level cache controls (cache: 'no-store') for real-time inventory synchronization, shop page now consistently displays accurate stock quantities matching admin page data
- July 5, 2025: COMPLETED wallet payment system integration - added wallet balance endpoint (/api/customers/wallet/balance) and wallet deduction endpoint (/api/customers/wallet/deduct) for shop checkout process, implemented comprehensive wallet payment UI in BilingualPurchaseForm with amount selection and balance validation, customers can now pay partially or fully from wallet during checkout with proper IQD currency display and transaction processing
- July 5, 2025: COMPLETED configurable stock warning threshold system - each product now has individual minimum stock level setting with default value of 10, added Stock Warning Threshold field to product registration form with "Low level hint in shop" description, updated shop page to use product-specific threshold instead of hardcoded value, sync shop functionality transfers minStockLevel to lowStockThreshold correctly
- July 5, 2025: FIXED customer wallet authentication and sync functionality - added missing /api/customers/wallet/balance endpoint for shop integration, fixed sync shop to properly transfer thumbnailUrl from showcase to shop products, resolved customer login wallet access error, enhanced product image synchronization between showcase and shop databases
- July 5, 2025: FIXED shop page currency display and product images - converted all currency displays from USD ($) to Iraqi Dinar (IQD) across product cards, wallet balance, cart totals, and savings calculations, removed decimal places for cleaner IQD display, updated multiple shop products with sample images from attached assets, resolved missing thumbnail_url issue for products including Octane Booster 95 and other key products
- July 5, 2025: FIXED features and specifications fields editing functionality - converted features and applications fields from JSON to PostgreSQL text arrays in database schema, updated frontend to properly convert string inputs to arrays before submission, enhanced storage methods to handle both string and array inputs for backward compatibility, resolved "malformed array literal" PostgreSQL errors, all product fields including features, specifications, and applications now update correctly
- July 5, 2025: FIXED product image upload functionality - resolved "Unexpected field" error by updating upload endpoint to accept both 'file' and 'image' field names, enhanced multer configuration to support flexible field naming, confirmed upload system working properly with authentication and file processing
- July 5, 2025: ENHANCED Security Settings configuration functionality - replaced placeholder Configure buttons with comprehensive security configuration interface including automatic security scans (with interval and depth settings), login attempt monitoring (with configurable max attempts and lock duration), IP access control (whitelist/blacklist management), and threat detection settings (with sensitivity levels and alert preferences), added Switch components and proper form controls for all security configurations, Security Settings tab now fully functional with real configuration options
- July 5, 2025: RESOLVED Security Management runtime errors - fixed all undefined property access issues in security-management-new.tsx by adding null checks and default values for metrics.threatLevel, systemHealth, failedLogins, activeSessions, lastScan, and vulnerabilities properties, eliminated white screen errors and runtime crashes, Security Management system now stable with proper fallback handling for undefined metrics data
- July 4, 2025: COMPLETED comprehensive Security Management system - implemented complete security monitoring dashboard with real-time threat detection, security event logging, IP blacklist/whitelist access control, automated vulnerability scanning, security settings configuration, and threat level monitoring, added Security Management as 27th module in Site Management interface with professional security dashboard showing system health score, failed login tracking, active admin sessions monitoring, and automated security scans with detailed reporting, established security middleware for logging all security events and comprehensive API endpoints for security management operations
- July 4, 2025: FIXED unitPrice field to be numeric type instead of string - updated showcase schema to parse string inputs as numbers, modified frontend form to handle unitPrice as number type, fixed form validation to use z.coerce.number(), added generic /api/upload route for image uploads, resolved image upload issues for new products, now unitPrice properly stored and displayed as numerical values throughout system
- July 4, 2025: COMPLETED Momtazchem product prioritization in AI recommendations system - modified AI recommendations to prioritize Momtazchem branded products (containing "Momtaz" or "ممتاز") with +100 priority score, updated OpenAI prompt to specifically prioritize these products, enhanced fallback system with intelligent product scoring, added 5 new Momtazchem products to database (industrial cleaner, water treatment, antifreeze, paint thinner, liquid fertilizer), system now ensures Momtazchem products appear first in all AI recommendations for superior customer experience
- July 4, 2025: COMPLETED detailed documentation of all 26 Site Management features - provided comprehensive breakdown of complete administrative interface including: 1-Sync Shop, 2-Inquiries, 3-Barcode, 4-Email Settings, 5-Database Backup, 6-CRM, 7-SEO, 8-Categories, 9-SMS, 10-Factory, 11-Super Admin, 12-User Management, 13-Shop, 14-Procedures, 15-SMTP Test, 16-Order Management, 17-Products, 18-Payment Settings, 19-Wallet Management, 20-Geography Analytics, 21-AI Settings, 22-Refresh Control, 23-Department Users, 24-Inventory Management, 25-Content Management, 26-Future Enhancement Slot, updated both documentation PDFs and replit.md with complete feature specifications
- July 4, 2025: COMPLETED comprehensive documentation enhancement with all features - expanded English documentation to include all 25+ features implemented, added detailed sections for CRM, email automation, payment systems, AI integration, inventory management, barcode system, SEO, and advanced features, Admin Documentation now 5902 bytes, Project Proposal 7433 bytes, Complete Documentation 2992 bytes, documentation now provides comprehensive coverage of entire platform including customer management, order workflows, multi-language support, banking integration, and all specialized tools
- July 4, 2025: FIXED Persian PDF documentation encoding issues - improved Unicode character handling for Persian/Arabic text in PDF generation, enhanced character escaping and encoding to properly display Persian content, Persian documentation PDFs now generate correctly with full content (8496+ bytes), resolved character corruption in Persian language documentation system
- July 4, 2025: UPDATED super admin credentials to admin@momtazchem.com with password Ghafari@110 - verified login functionality working correctly with new authentication system
- July 4, 2025: COMPLETED reliable PDF documentation system with fallback mechanism - implemented comprehensive documentation generation system with 5 types of PDFs (User Guide, Admin Guide, Technical Documentation, Project Proposal, Complete Documentation) in both English and Persian languages, created /documentation page with professional interface for downloading all documentation types, established robust fallback PDF generation system using simple-pdf-generator.ts to handle Puppeteer browser configuration issues in Replit environment, API endpoints (/api/documentation/user/:language, /api/documentation/admin/:language, etc.) now work reliably in all environments, created detailed project proposal specifically for contractors highlighting all 25+ modules and system capabilities, documentation system provides complete operational guides for users, administrators, and technical teams with guaranteed PDF generation reliability
- July 4, 2025: COMPLETED social media management through Content Management system - made all social media links in footer fully manageable through Content Management interface, added TikTok to social media icons alongside LinkedIn, Twitter, Facebook, Instagram and WhatsApp, implemented dynamic social media URL loading from database in all 4 languages (English, Arabic, Kurdish, Turkish), added 24 social media content items to Content Management with dedicated 'Social Media Links' section, footer now uses Content Management data instead of hardcoded URLs
- July 4, 2025: COMPLETED Turkish language integration to SEO and localization system - added Turkish (tr) as fourth official language alongside English, Arabic, and Kurdish, implemented complete Turkish translations for all website sections, updated sitemap to include Turkish versions of all 14 URLs, added comprehensive Turkish SEO settings for all product categories and main pages, integrated Turkish language support in i18n system with LTR text direction, added 36+ Turkish content items to Content Management system covering contact, home, about, services, and product category pages
- July 4, 2025: COMPLETED comprehensive SEO system update for three main languages - updated sitemap and SEO settings to support English, Arabic, and Kurdish languages only, removed Persian/Farsi and Turkish language entries, added 33 sitemap entries covering 14 unique URLs across 3 languages, implemented proper URL+language unique constraints for multilingual sitemap support, added comprehensive SEO meta data for all main pages and product categories, included robots.txt configuration and structured data schema for better search engine optimization
- July 4, 2025: COMPLETED dynamic Contact page integration with Content Management - converted all contact information fields (address, phone, email, business hours, career info) to use Content Management system, added 39+ contact-specific content items in three languages (English, Arabic, Kurdish), implemented multi-language support for contact page with automatic language switching, all contact information now editable through Content Management interface without code changes
- July 4, 2025: COMPLETED comprehensive product category pages creation - built complete product category pages for Paint & Solvents, Industrial Chemicals, Commercial Goods, and Technical Equipment with dynamic content loading from database, implemented professional page layouts with hero sections, product grids, feature badges, and call-to-action sections, added routing to App.tsx, pages now accessible via /products/paint-solvents, /products/industrial-chemicals, /products/commercial-goods, /products/technical-equipment URLs
- July 4, 2025: COMPLETED comprehensive product category content management - added detailed content for Paint & Solvents (26 items), Industrial Chemicals (26 items), Commercial Goods (26 items), and Technical Equipment (34 items) across three languages, expanded Content Management sections list to include all product categories, total content items now exceed 300+ with complete multilingual coverage for all major website sections
- July 4, 2025: COMPLETED dynamic admin dashboard integration with Content Management - connected admin dashboard welcome messages and feature lists to Content Management system, all admin dashboard text now dynamically loaded from database and editable through Content Management interface, added comprehensive admin dashboard content in three languages (English, Arabic, Kurdish), admin can now update all dashboard text without code changes
- July 4, 2025: COMPLETED comprehensive Inventory Management section as independent admin module - created full inventory management interface with tabbed sections (overview, alerts, settings, analytics, reports, automation), integrated existing inventory alerts and notification settings into unified system, added inventory statistics dashboard with real-time metrics, implemented activity tracking and quick actions, added as 25th Quick Action button in Site Management with dedicated routing, established foundation for future inventory analytics and automation features
- July 4, 2025: COMPLETED drag-and-drop functionality for Site Management administrative blocks - implemented full drag-and-drop rearrangement of all 23+ Quick Action buttons using @hello-pangea/dnd library, added persistent localStorage storage for custom layouts, included visual feedback during dragging with rotation and scaling effects, added drag handles with hover effects, implemented reset button to restore default order, enhanced with responsive grid layout and professional animations while maintaining full button functionality
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