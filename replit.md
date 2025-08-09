# Momtazchem Chemical Solutions Platform

## Overview
The Momtazchem Chemical Solutions Platform is a comprehensive, multilingual system integrating a public showcase website, e-commerce, and administrative tools for a chemical company. Its primary purpose is to optimize CRM, inventory, sales, logistics, and financial management while expanding market reach. Key capabilities include multi-language support (English, Arabic, Kurdish, Turkish), unified site management, advanced e-commerce, GPS tracking, real-time analytics, email automation, barcode and Kardex-synced inventory, and financial management. The project aims to establish Momtazchem as a digital leader in the chemical industry.

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
The system is built on a robust full-stack architecture with comprehensive security, including multi-level authentication, session management, password hashing (Bcrypt), and role-based access control. It integrates real-time capabilities for GPS tracking, inventory alerts, and order status. The platform supports dynamic multilingual content localization and adaptable UI layouts. Core business logic covers product management, order processing, customer relationship management, and logistics, with a strong focus on automation and data integrity. Key features include systematic auto-approval for payments, standardized geographical data, a vehicle template system for logistics, and a hybrid payment system. It includes a two-stage warehouse approval system and FIFO (First-In, First-Out) batch management for inventory. All print functionality and relevant displays standardize Gregorian date formats. Product displays are filtered to show only products with active status, stock quantity > 0, valid SKU, barcode, and complete documentation (kardex, catalog, MSDS). A persistent customer cart system stores cart data across sessions and syncs with user authentication. The system implements comprehensive payment method support and gateway routing, including pure wallet, wallet+gateway combinations, direct bank, and online payments, ensuring proper routing and order number assignment upon payment confirmation. It also features intelligent contact form email routing based on product category, dynamic vehicle template integration, and a configurable global CC email system. Social media links and footer content are managed via the CMS for dynamic updates. Production reset functionality allows optional customer data preservation. Price range filters are optimized for user experience, and a robust order number assignment ensures consistent sequencing.

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

## Recent Changes

**Email-Based Customer Order Search & Deletion with Autocomplete (August 2025)**: Implemented comprehensive customer order management system in super admin interface. Added new backend endpoint `/api/super-admin/customer-orders-by-email/:email` that searches orders across customer tables (guest orders, registered customers, and CRM customers) using email addresses. Enhanced super admin interface with dedicated "سفارشات مشتری" (Customer Orders) tab featuring email-based search functionality with intelligent autocomplete suggestions. Added `/api/super-admin/email-suggestions` endpoint that provides email suggestions when typing 3+ characters, searching across all customer data sources (guest orders, registered customers, CRM customers) with real-time dropdown suggestions. System maintains all existing security protections and integrates seamlessly with the current order deletion infrastructure. This resolves the user request "امکان حذف سفارشات" by providing intuitive email-based order lookup with autocomplete assistance instead of requiring numeric customer IDs.

**Pure Wallet Payment Routing Fix (August 2025)**: Permanently resolved critical issue where pure wallet payments were incorrectly going to finance department instead of directly to warehouse. Enhanced backend payment processing to properly handle all wallet payment variations (wallet, wallet_full, wallet_partial) and ensure automatic order number assignment with direct warehouse routing. Fixed specific case of order M2511161 and implemented comprehensive backend logic to prevent future occurrences. Pure wallet payments now automatically update to paid status, receive order numbers, and proceed directly to warehouse_pending without manual intervention. System now correctly distinguishes between partial wallet payments requiring additional bank payment and complete wallet payments that should bypass finance approval entirely.

**KPI Dashboard Populated with Real Data (August 2025)**: Completely replaced all placeholder data in the KPI dashboard with authentic values retrieved directly from the database. Updated customer statistics (57 total customers, 28 new this month), product inventory (6 products, 9,219 total stock), financial metrics (135,000 total wallet balance, 320,422,351.01 transaction volume), and operational data (181 transactions). Eliminated all mock data and implemented comprehensive real-time metrics display showing actual system performance including customer growth rate of 96.6% and transaction volume distribution. Dashboard now provides accurate business intelligence for decision-making based on live database queries.

**Multi-Vehicle Heavy Load Management System (August 2025)**: Implemented comprehensive solution for handling cargo weights exceeding single vehicle capacity. System automatically detects when shipments require multiple vehicles (e.g., 28,000kg load requiring 2 tankers) and provides optimal vehicle combination algorithms. Added intelligent load distribution using greedy algorithm that maximizes efficiency and minimizes total cost. For heavy loads, system calculates multiple vehicle requirements, individual load weights, and provides detailed cost breakdown with total vehicles needed, combined cost, and average cost per kilogram. Enhanced filtering logic to allow suitable vehicles for multi-vehicle scenarios while maintaining all safety and route compatibility requirements. Successfully tested with loads up to 50,000kg requiring 3 vehicles with accurate cost calculations and load distribution.

**Permanent Order Management System - No Temporary Orders (August 2025)**: Completely redesigned order creation strategy to eliminate temporary orders. All orders now receive permanent status and order numbers immediately upon creation, regardless of payment method. Implementation includes: (1) **Success Policy**: Successful payments keep orders with assigned numbers and proceed to warehouse, (2) **Failure Policy**: Failed payments immediately delete permanent orders to free up order numbers for reuse, including inventory restoration, (3) **Grace Period Policy**: Time-limited orders (bank_transfer_grace) are only retained with explicit financial department confirmation, otherwise deleted after 3-day expiration. Enhanced payment callback system to handle permanent order cleanup, added financial confirmation endpoint `/api/admin/orders/confirm-grace-period-payment` for manual approval/rejection, and updated cleanup service to reflect permanent order deletion with number recycling. This ensures gap-free order numbering while maintaining system integrity.

**Automatic Proforma-to-Invoice Conversion System (August 2025)**: Implemented comprehensive automatic conversion system that transforms proforma invoices to official invoices when orders are shipped or delivered from warehouse. System includes: (1) **AutoInvoiceConverter Service**: Automatically detects order status changes to 'shipped' or 'delivered' and triggers conversion, (2) **Integration Points**: Built into order-management-storage.ts and routes.ts order status update functions to ensure all status changes trigger conversion checks, (3) **Periodic Check**: Runs every 10 minutes to catch any missed conversions, (4) **Database Updates**: Automatically updates invoiceType from 'proforma' to 'official_invoice' and sets invoiceConvertedAt timestamp, (5) **Customer Profile Reflection**: Converted orders immediately appear as official invoices in customer purchase history and profiles across all system components. Manual conversion UI remains available in Shop Admin for administrative override when needed. This ensures seamless business process automation while maintaining complete audit trails.