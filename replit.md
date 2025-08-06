# Momtazchem Chemical Solutions Platform

## Overview
The Momtazchem Chemical Solutions Platform is a comprehensive, multilingual solution integrating a public showcase website, an advanced e-commerce system, and robust administrative tools. Designed for Momtazchem, a chemical company in Iraq and the Middle East, its purpose is to streamline operations across CRM, inventory, sales, logistics, and financial management, while enhancing customer engagement and market reach. Key capabilities include multi-language support (English, Arabic, Kurdish, Turkish), unified site management with over 34 administrative modules, advanced e-commerce with order and payment management, a GPS tracking system, comprehensive CRM, real-time analytics, email automation, inventory management with barcode and kardex sync, and financial management. The project aims to achieve significant market potential and establish Momtazchem as a digital leader in the chemical solutions industry.

## User Preferences
Preferred communication style: Simple, everyday language.

**Recent Completions:**
- MAJOR SIMPLIFICATION: All calculations now use ONLY cart subtotal (August 6, 2025)
- Removed ALL additional calculations: shipping, tax, delivery costs, smart delivery
- Payment gateway simplified to send ONLY cart products total to Bank Saman
- Persian/Farsi client requirement: "تمام محاسبات فقط باید مبنا کارت خرید مشتری باشد"
- Order structure fixed: subtotalAmount equals cart total, shippingCost = 0
- bilingual-purchase-form.tsx: totalAmount = subtotalAmount (no additional costs)
- payment-gateway.tsx: amountForGateway = finalAmount (cart total only)
- Session authentication working: Customer ID 8 logged in successfully
- Weight calculations restored: Calculate total weight from cart products (August 6, 2025)
- Fixed runtime errors: optimalVehicle, sessionCart variables removed/corrected
- Working example: Customer ABAS ABASI, 50× Solvant 402 = 1,250 IQD + 550kg total weight

**Critical Security Requirements:**
- Extreme vigilance in wallet transaction processing
- Always verify customer_id matches between orders and wallet transactions
- Never allow cross-customer wallet operations
- Implement quadruple verification for all payment corrections
- Maintain detailed audit trails for all financial operations

## System Architecture

### UI/UX Decisions
The platform features a professional, modern, and multilingual user interface with responsive design using Tailwind CSS and Shadcn/ui. UI elements dynamically adapt for RTL/LTR languages. Visual consistency is maintained through a unified design system, professional iconography (Lucide React), and smooth animations (Framer Motion). Color schemes are strategically used for status indication and categorization. The administrative interface prioritizes intuitive design with drag-and-drop functionality and clear visual indicators.

### Technical Implementations
The system is built on a robust full-stack architecture with comprehensive security, including multi-level authentication, session management, password hashing (Bcrypt), and role-based access control. It integrates real-time capabilities for GPS tracking, inventory alerts, and order status updates. The platform supports dynamic multilingual content localization and adaptable UI layouts. Core business logic covers product management, order processing, customer relationship management, and logistics, with a focus on automation and data integrity. Key implementations include a systematic auto-approval system for payments, standardized geographical data, a vehicle template system for optimized logistics, and a fully automated hybrid payment system combining digital wallet and bank gateway functionalities with immediate wallet deduction and automatic bank gateway redirection. All React Portal usage has been eliminated. All print functionality now uses Gregorian date formats (DD/MM/YYYY). Product display is filtered to show only real products with proper inventory and complete documentation (kardex, catalog, MSDS). A comprehensive wallet payment system handles both wallet-only and hybrid transactions with persistent cart recovery and automatic order restoration after failed payments.

### System Design Choices
The architecture emphasizes modularity and scalability through a RESTful API design. Data integrity is maintained via transactional operations. The system employs a prevention-first approach to avoid data inconsistencies. A unified vehicle selection algorithm prioritizes cost-efficiency and safety. Inventory management adheres to FIFO principles. A comprehensive email and SMS automation system leverages templates and intelligent routing. The system is designed for continuous integration and deployment, focusing on performance optimization. Critical database synchronization between `customer_orders` and `order_management` tables is ensured through real-time database triggers for instant consistency. A two-stage approval workflow (`warehouse_pending` → `warehouse_verified` → `warehouse_approved`) is implemented for warehouse operations, with auto-sync protection respecting protected statuses and automatic SMS notifications for delivery codes on final approval.

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
Key tables cover Customer Management (`crm_customers`, `customer_loyalty_points`), Order Processing (`customer_orders`, `order_management`, `payment_receipts`), Product Catalog (`showcase_products`), Inventory (`warehouse_inventory`), Logistics (`iraqi_cities`, `vehicle_templates`, `gps_delivery_confirmations`), Content Management (`content_items`, `email_templates`), and User Management (`users`, `custom_roles`).

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