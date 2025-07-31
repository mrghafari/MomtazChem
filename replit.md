# Momtazchem Chemical Solutions Platform

## Overview

Momtazchem Chemical Solutions Platform is a comprehensive, multilingual solution designed for Momtazchem, a leading chemical products company in Iraq and the Middle East. The platform integrates a public-facing website, advanced e-commerce capabilities, and robust administrative tools.

Key capabilities include:
- **Multilingual Support**: Full support for English, Arabic, Kurdish, and Turkish, including RTL/LTR management.
- **Unified Site Management**: Over 34 integrated administrative modules for comprehensive control.
- **Advanced E-commerce**: Features a sophisticated online store with order and payment management.
- **GPS Tracking**: Real-time GPS tracking for deliveries across 11 Iraqi cities.
- **CRM Integration**: Comprehensive customer management, loyalty programs, and activity tracking.
- **Real-time Analytics**: Live analysis and geographical reporting.
- **Email Automation**: Automated email campaigns with over 18 customizable templates.
- **Inventory Management**: Warehouse management with barcode and Kardex synchronization.
- **Financial Management**: Includes wallet management and transaction tracking.

The business vision is to provide a unified digital platform that enhances operational efficiency, customer engagement, and market reach across the chemical solutions sector in the region.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Technology Stack
- **React 18** with TypeScript
- **Tailwind CSS** for responsive UI
- **Wouter** for routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod for form handling
- **Shadcn/ui** for consistent design
- **Lucide React** for iconography
- **Framer Motion** for animations

### Backend Technology Stack
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL (Neon Cloud)** as the primary database
- **Drizzle ORM** for database interaction
- **Express Sessions** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Nodemailer** for email automation
- **SMS integration** for notifications

### Database Schema Highlights
- **Customer Management**: `crm_customers`, `customer_loyalty_points`, `customer_activities`
- **Order Processing**: `customer_orders`, `order_items`, `order_management`, `payment_receipts`
- **Product Catalog**: `showcase_products`, `product_reviews`, `product_stats`, `categories`
- **Inventory**: `warehouse_inventory`, `inventory_alerts`, `batch_tracking`
- **Logistics**: `iraqi_cities`, `iraqi_provinces`, `vehicle_templates`, `gps_delivery_confirmations`
- **Content Management**: `content_items`, `email_templates`, `seo_pages`
- **User Management**: `users`, `custom_users`, `custom_roles`, `user_sessions`

### Security Features
- **Multi-level Authentication**: Admin, custom users, and customer authentication.
- **Session Management**: Secure session handling.
- **Password Security**: Bcrypt hashing.
- **Permission System**: Role-based access control (RBAC) across modules.
- **Input Validation**: Zod schema validation on all API endpoints.
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM.

### UI/UX Decisions
- **Color Schemes**: Professional color palettes consistent with brand identity, including gradients and thematic color coding for different modules (e.g., blue for finance, green for marketing).
- **Templates**: Utilizes Shadcn/ui components for a consistent and modern design system.
- **Design Approaches**: Responsive layouts adapting to various screen sizes, intuitive drag-and-drop interfaces for management, and clear visual feedback mechanisms (e.g., badges, color-coded indicators, real-time updates). RTL/LTR support is seamlessly integrated for multilingual layouts.

### Technical Implementations
- **API Endpoints Structure**: Organized logically for authentication, product management, order processing, CRM, logistics, content, and analytics.
- **Real-time Features**: GPS tracking, auto-refresh systems, inventory alerts, order status updates, and automated customer notifications (email/SMS).
- **Multilingual Support**: Automatic RTL/LTR handling, centralized language files, dynamic UI adaptation, and localized content management.

### System Design Choices
- **Unified Inventory Management**: Ensures consistency between display (showcase) and sales (shop) inventories through a bidirectional synchronization system.
- **FIFO Inventory System**: Prioritizes older product batches for sales, crucial for chemical products with expiry dates.
- **Smart Vehicle Selection**: Algorithm-based selection of optimal transport methods factoring in load, distance, cost, and safety (e.g., flammable materials compliance).
- **Automated Financial Approval**: Streamlines payment verification for bank transfers and wallet payments, minimizing manual intervention.
- **Hybrid Payment System**: Allows combining digital wallet funds with bank gateway payments for increased flexibility.
- **Comprehensive Logging**: Detailed audit trails for all system activities, including financial transactions, order progressions, and security events.

## External Dependencies

- **Database**: Neon PostgreSQL cloud service.
- **Email Service**: Zoho Mail SMTP (configurable for other providers).
- **File Storage**: Local filesystem (upgradeable to cloud storage).
- **UI Components**: Radix UI primitives and Shadcn/ui.
- **AI Services**: OpenAI API for SKU generation and product recommendations.
- **Payment Processing**: Integrates with major Iraqi banks (Rasheed Bank, Al-Rafidain Bank, Trade Bank of Iraq).
- **Live Chat**: Tawk.to.
- **SMS Services**: Configurable providers for customer notifications.
- **Barcode Generation**: EAN-13 barcode system with GS1 compliance.
- **PDF Generation**: PDFKit and html2canvas for various reports and invoices.
- **Remote Desktop**: RustDesk for remote assistance.
- **Font Integration**: Google Fonts for multilingual typography.