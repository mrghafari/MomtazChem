# Momtazchem Chemical Solutions Platform

## Overview
Momtazchem Chemical Solutions Platform is a comprehensive, multilingual solution designed for Momtazchem, a leading chemical company in Iraq and the Middle East. It integrates a public-facing showcase website, an advanced e-commerce system, and robust administrative tools. The platform aims to streamline operations across customer relationship management (CRM), inventory, sales, logistics, and financial management, while enhancing customer engagement and market reach. Key capabilities include multi-language support (English, Arabic, Kurdish, Turkish), unified site management with over 34 administrative modules, advanced e-commerce with order and payment management, a GPS tracking system for 11 Iraqi cities, comprehensive CRM, real-time analytics, email automation, inventory management with barcode and kardex sync, and financial management. The project's vision is to achieve significant market potential and establish Momtazchem as a digital leader in the chemical solutions industry.

## User Preferences
Preferred communication style: Simple, everyday language.

**Critical Security Requirements:**
- Extreme vigilance in wallet transaction processing
- Always verify customer_id matches between orders and wallet transactions
- Never allow cross-customer wallet operations
- Implement quadruple verification for all payment corrections
- Maintain detailed audit trails for all financial operations

## System Architecture

### UI/UX Decisions
The platform features a professional, modern, and multilingual user interface. It incorporates responsive design principles using Tailwind CSS and Shadcn/ui components. UI elements dynamically adapt for RTL/LTR languages (e.g., Arabic/Kurdish). Visual consistency is maintained through a unified design system, professional iconography (Lucide React), and smooth animations (Framer Motion). Color schemes are strategically used to denote status or categorize information (e.g., green for positive, red for alerts, blue/purple for financial sections). The administrative interface prioritizes intuitive design with drag-and-drop functionality and clear visual indicators.

### Technical Implementations
The system is built on a robust full-stack architecture. Features include comprehensive security with multi-level authentication, session management, password hashing (Bcrypt), and role-based access control. Real-time capabilities such as GPS tracking, inventory alerts, and order status updates are integrated. The platform supports dynamic multilingual content localization and adaptable UI layouts. Core business logic is implemented for product management, order processing, customer relationship management, and logistics, with a strong focus on automation and data integrity. Key implementations include a systematic auto-approval system for payments, standardized geographical data, a vehicle template system for optimized logistics, and a hybrid payment system combining digital wallet and bank gateway functionalities.

**Recent Security Enhancements (August 2025):**
- Implemented comprehensive wallet security audit system (`audit_wallet_security()`)
- Created secure payment correction function (`secure_payment_correction()`) with quadruple verification
- Resolved critical cross-customer wallet transaction issues affecting 35M+ IQD
- Added systematic payment correction algorithm for all historical orders
- Established wallet security controls documentation and best practices

**Financial Management System Fixes (August 2025):**
- Fixed transferred orders list in finance section by removing duplicate API endpoints
- Implemented email-based customer search in wallet modification form with autocomplete
- Added proper authentication middleware to wallet balance modification endpoint
- Resolved apiRequest method compatibility issues for POST requests
- Enhanced customer search with name/mobile display for better user experience

**Payment Method Display Standardization (August 2025):**
- Created centralized PaymentMethodBadge component for consistent payment method visualization
- Standardized payment method icons and color schemes across all management modules
- Implemented support for all payment types: wallet_full, wallet_partial, online_payment, bank_transfer, bank_transfer_grace, hybrid, cash, credit
- Updated logistics, warehouse, finance, super-admin, shop-admin, and customer profile modules
- Enhanced print layouts with professional company branding integration

**Critical Database Synchronization Solution (August 2025):**
- **RESOLVED:** 26 orders stuck in financial department due to status sync issues
- **IMPLEMENTED:** Real-time database triggers for INSTANT synchronization between `customer_orders` and `order_management`
- **ZERO TOLERANCE:** Database-level triggers ensure consistency with NO delays (not even milliseconds)
- **ACID TRANSACTIONS:** Implemented TransactionSync class with full rollback support
- **BACKUP SAFETY:** Secondary sync service runs every 5 minutes as additional safety net
- **DATABASE TRIGGERS:** `customer_orders_sync_trigger`, `customer_orders_insert_sync_trigger`, `customer_orders_delete_sync_trigger`
- **GUARANTEED CONSISTENCY:** Even if application crashes, database maintains perfect synchronization

**Vehicle Optimization System (August 2025):**
- **INTELLIGENT MATCHING:** Implemented API endpoint `/api/logistics/vehicle-optimization` that matches vehicle templates to ready vehicles
- **SMART SUGGESTIONS:** System suggests specific vehicles with license plates, drivers, and mobile numbers for each order
- **AUTOMATED CREATION:** Missing vehicles are automatically created in database when suggested vehicles don't exist
- **COMPREHENSIVE ANALYSIS:** Optimization considers order weight, destination, flammable content, and cost efficiency
- **SEAMLESS INTEGRATION:** New "بهینه‌سازی خودرو" button added to logistics management interface
- **REAL-TIME RESULTS:** Interactive dialog shows optimization results with vehicle details and cost breakdown
- **ONE-CLICK DEPLOYMENT:** Users can instantly create ready vehicles from optimization suggestions

### System Design Choices
The architecture emphasizes modularity and scalability. Core architectural patterns include a RESTful API design for backend-frontend communication, ensuring clear separation of concerns. Data integrity is maintained through transactional operations for critical processes like order creation and inventory updates. The system employs a prevention-first approach to avoid data inconsistencies. A unified vehicle selection algorithm prioritizes cost-efficiency and safety compliance, particularly for hazardous materials. Inventory management strictly adheres to FIFO (First-In, First-Out) principles. A comprehensive email and SMS automation system leverages templates and intelligent routing. The system is designed for continuous integration and deployment, with a focus on performance optimization through database indexing, caching, and asset optimization.

### Frontend Technology Stack
- **React 18** with TypeScript
- **Tailwind CSS** for responsive UI
- **Wouter** for client-side routing
- **TanStack Query (React Query)** for server state management
- **React Hook Form** with Zod validation
- **Shadcn/ui** components
- **Lucide React** icons
- **Framer Motion** for animations

### Backend Technology Stack
- **Node.js** with Express.js
- **TypeScript** for type-safe development
- **PostgreSQL (Neon Cloud)** as primary database
- **Drizzle ORM** for database queries and migrations
- **Express Sessions** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Nodemailer** for email automation
- SMS integration

### Database Schema
Key tables cover:
- **Customer Management**: `crm_customers`, `customer_loyalty_points`, `customer_activities`
- **Order Processing**: `customer_orders`, `order_items`, `order_management`, `payment_receipts`
- **Product Catalog**: `showcase_products`, `product_reviews`, `product_stats`, `categories`
- **Inventory**: `warehouse_inventory`, `inventory_alerts`, `batch_tracking`
- **Logistics**: `iraqi_cities`, `iraqi_provinces`, `vehicle_templates`, `ready_vehicles`, `gps_delivery_confirmations`, `international_countries`, `international_cities`, `international_shipping_rates`
- **Content Management**: `content_items`, `email_templates`, `seo_pages`, `sms_settings`, `tax_settings`
- **User Management**: `users`, `custom_users`, `custom_roles`, `user_sessions`

## External Dependencies

- **Database**: Neon PostgreSQL cloud service
- **Email Service**: Zoho Mail SMTP (configurable for other providers)
- **SMS Services**: Integration with Iraqi operators (Asiacell, Zain Iraq, Korek Telecom) and international providers (Twilio, Plivo, Infobip, MSG91)
- **Payment Processing**: Integration with Iraqi banks (Rasheed Bank, Al-Rafidain Bank, Trade Bank of Iraq)
- **AI Services**: OpenAI API for SKU generation and product recommendations (e.g., GPT-4o)
- **Live Chat**: Tawk.to live chat widget
- **PDF Generation**: Puppeteer (server-side) and PDFKit/pdfMake (for client-side or specific server needs)
- **Barcode Generation**: GS1-compliant EAN-13 barcode system
- **Remote Desktop**: RustDesk (primary recommendation), TeamViewer, AnyDesk, Chrome Remote Desktop, Microsoft RDP for support.