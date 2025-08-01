# Momtazchem Chemical Solutions Platform

## Overview
Momtazchem Chemical Solutions Platform is a comprehensive multilingual chemical solutions platform for Momtazchem, a leading chemical products company in Iraq and the Middle East. It integrates a public showcase website, advanced e-commerce functionalities, and robust management tools.

**Key Capabilities:**
- Multilingual Support (English, Arabic, Kurdish, Turkish) with RTL/LTR management.
- Unified Site Management with over 34 integrated administrative modules.
- Advanced E-commerce system with sophisticated order and payment management.
- GPS Tracking System active in 11 Iraqi cities for delivery optimization.
- Comprehensive CRM with customer loyalty and scoring systems.
- Real-time Analytics and geographical reporting.
- Email Automation with over 18 templates for various communications.
- Inventory Management featuring barcode systems and Kardex sync.
- Financial Management including wallet and transaction oversight.

The platform aims to streamline operations, enhance customer engagement, and provide robust tools for business growth in the chemical industry, addressing market potential in Iraq and the broader Middle East.

## User Preferences
Preferred communication style: Simple, everyday language.
Payment summaries: Always implement comprehensive payment summaries for ALL orders in financial interfaces, not just specific orders. Include payment method, amounts, status, dates, and detailed breakdowns when available.

## System Architecture

### UI/UX Decisions
- Modern, responsive design using Tailwind CSS and Shadcn/ui components.
- Multilingual UI adaptation including RTL/LTR handling for Arabic/Kurdish.
- Professional iconography with Lucide React.
- Smooth animations and transitions powered by Framer Motion.
- Color schemes: Blue for financial modules, green for non-chemical products, purple for marketing, emerald for smart vehicle selection, orange for bank transfers.

### Technical Implementations
**Frontend:**
- **React 18** with TypeScript.
- **Tailwind CSS** for styling.
- **Wouter** for routing.
- **TanStack Query** for server state management.
- **React Hook Form** with Zod for form validation.

**Backend:**
- **Node.js** with Express.js.
- **TypeScript** for type safety.
- **PostgreSQL (Neon Cloud)** as the primary database.
- **Drizzle ORM** for database interactions.
- **Bcrypt** for password hashing.
- **Multer** for file uploads.
- **Nodemailer** for email automation.
- SMS integration for customer notifications.

### Feature Specifications
- **Comprehensive API Endpoints:** Structured for authentication, product management, order processing, CRM, logistics, content, and analytics.
- **Real-time Features:** Live GPS tracking, auto-refresh systems, inventory alerts, and order status updates.
- **Multilingual Support:** Dynamic UI adaptation, centralized translation management, and RTL/LTR handling.
- **Security Features:** Multi-level authentication (Admin, Custom Users, Customer), secure session management, role-based access control (RBAC), and input validation.
- **Administrative Modules:** Over 34 modules covering KPI Dashboard, Shop Management, Product Management, Order Management & Tracking, Warehouse Management, Logistics Management, CRM Management, Barcode Management, Email Settings, Database Backup, SEO Management, Categories Management, SMS Management, User Management, Payment Management, Financial Management, Wallet Management, Geographic Analytics, AI Settings, Content Management, Ticketing System, Server Configuration, Marketing Module, and Site Management.
- **Business Intelligence:** Customer Loyalty System (points accumulation, tier classification, discount conversion), Marketing Automation (email campaigns, audience segmentation), and Geographic Intelligence (delivery optimization, route planning).
- **Payment System:** Hybrid wallet + bank gateway integration allowing partial wallet payments.
- **Vehicle Selection:** Algorithm-based selection for optimal cost and safety (flammable materials compliance).
- **Order Synchronization:** Mandatory management record creation for consistency and auto-approval for bank transfers and wallet payments.
- **Geographical Data:** Standardized Iraqi geographical data with unified Arabic naming and automatic conversion.
- **Inventory Management:** FIFO (First In, First Out) batch management system for chemical products.
- **Product Reviews:** Comprehensive product review and rating system with customer authentication.
- **Dynamic Content Control:** Toggle buttons in Content Management to control visibility of website elements like discount banners and AI features.

### System Design Choices
- **Unified Interface:** Centralized Site Management for all administrative functions.
- **Modular Design:** Separation of concerns into distinct modules for maintainability and scalability.
- **Prevention-First Approach:** Proactive error prevention and consistency enforcement over reactive fixes.
- **Database Schema:** Granular schema design across customer management, order processing, product catalog, inventory, logistics, content, and user management.
- **Performance Optimization:** Database indexing, caching strategies, image optimization, and API rate limiting.
- **Monitoring & Analytics:** Comprehensive error tracking, performance metrics, and user analytics.

## External Dependencies

- **Database:** Neon (PostgreSQL cloud service)
- **Email Service:** Zoho Mail SMTP (configurable for other providers)
- **File Storage:** Local filesystem
- **UI Components:** Radix UI primitives, Shadcn/ui
- **AI Services:** OpenAI API
- **SMS Services:** Various providers (Asiacell, Zain Iraq, Korek Telecom, Twilio, Plivo, Infobip, MSG91)
- **Payment Processing:** Iraqi banking system integration (Rasheed Bank, Al-Rafidain Bank, Trade Bank of Iraq)
- **Live Chat:** Tawk.to
- **PDF Generation:** Puppeteer, PDFKit, pdfMake
- **Barcode Generation:** JsBarcode
- **Fonts:** Google Fonts (Noto Sans Arabic, Amiri, Scheherazade New, Vazir)
- **Drag-and-Drop:** @hello-pangea/dnd