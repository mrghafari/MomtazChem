# Momtazchem Chemical Solutions Platform

## Overview
The Momtazchem Chemical Solutions Platform is a comprehensive, multilingual system integrating a public showcase website, e-commerce, and administrative tools for a chemical company. Its primary purpose is to optimize CRM, inventory, sales, logistics, and financial management while expanding market reach. Key capabilities include multi-language support (English, Arabic, Kurdish, Turkish), unified site management, advanced e-commerce, GPS tracking, real-time analytics, email automation, barcode and Kardex-synced inventory, and financial management. The project aims to establish Momtazchem as a digital leader in the chemical industry.

## Recent Changes (October 2025)
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
- **Payment Processing**: Iraqi banks (Rasheed Bank, Al-Rafidain Bank, Trade Bank of Iraq)
- **AI Services**: OpenAI API (for SKU generation, product recommendations)
- **Live Chat**: Tawk.to
- **PDF Generation**: Puppeteer, PDFKit/pdfMake
- **Barcode Generation**: GS1-compliant EAN-13 barcode system
- **Remote Desktop**: RustDesk, TeamViewer, AnyDesk, Chrome Remote Desktop, Microsoft RDP