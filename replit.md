# Momtazchem Chemical Solutions Platform

## Overview
The Momtazchem Chemical Solutions Platform is a comprehensive, multilingual system for a leading chemical company, designed to integrate a public showcase website, an e-commerce system, and administrative tools. Its purpose is to optimize CRM, inventory, sales, logistics, and financial management while expanding market reach. Key capabilities include multi-language support (English, Arabic, Kurdish, Turkish), unified site management with numerous administrative modules, advanced e-commerce, GPS tracking across Iraqi cities, real-time analytics, email automation, barcode and Kardex-synced inventory, and financial management. The project aims to establish Momtazchem as a digital leader in the chemical industry.

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
The system is built on a robust full-stack architecture with comprehensive security, including multi-level authentication, session management, password hashing (Bcrypt), and role-based access control. It integrates real-time capabilities for GPS tracking, inventory alerts, and order status. The platform supports dynamic multilingual content localization and adaptable UI layouts. Core business logic covers product management, order processing, customer relationship management, and logistics, with a strong focus on automation and data integrity. Key features include a systematic auto-approval for payments, standardized geographical data, a vehicle template system for logistics, and a hybrid payment system. It includes a two-stage warehouse approval system and an implemented FIFO (First-In, First-Out) batch management for inventory. All print functionality and relevant displays standardize Gregorian date formats. Product displays are filtered to show only products with active status, stock quantity > 0, valid SKU, barcode, and complete documentation (kardex, catalog, MSDS). A persistent customer cart system stores cart data across sessions and syncs with user authentication.

**Order Workflow Protection System (August 2025)**: Implemented comprehensive protection logic in sync-service.ts to prevent automatic status corrections from reverting manually approved orders. Orders with financial_reviewed_at timestamps are now permanently protected from auto-sync corrections, preserving the manual approval workflow for partial payments. Enhanced determineManagementStatus() function with manual approval detection to handle partial payments intelligently. Added test endpoint (/api/test/workflow-protection) for validation. System now prevents approved orders from being incorrectly reverted to pending status without requiring manual intervention.

**Intelligent Contact Form Email Routing (August 2025)**: Enhanced contact form system to automatically route inquiries to appropriate department email addresses based on product category selection. Contact form now uses category-specific email assignments: Water Treatment → water@momtazchem.com, Fuel Additives → fuel@momtazchem.com, Paint & Thinner → thinner@momtazchem.com, Agricultural Fertilizers → fertilizer@momtazchem.com, with sales@momtazchem.com handling industrial chemicals, technical equipment, and commercial goods. Updated automated email logs interface to display comprehensive sender/recipient details including TO/CC/BCC breakdown and automatic archival notifications. System provides complete email traceability with content preview functionality.

**Dynamic Vehicle Template Integration (August 2025)**: Restructured vehicle management system to use vehicle templates from database as dynamic categories. Ready vehicles now reference vehicle_templates table through foreign key relationships. All vehicle registration forms (create/edit) dynamically load options from the 11 vehicle templates in database, ensuring consistency across the system. When templates are added/removed from database, all forms automatically reflect these changes without code modifications. Updated form labels to use "الگوی خودرو" (Vehicle Template) terminology instead of "نوع خودرو" (Vehicle Type). Removed custom vehicle type options from create form to enforce template compliance. Edit forms maintain dynamic template synchronization with proper state management (selectedEditVehicleType) and automatic sync with database templates through useEffect hooks. Fixed runtime errors by consolidating duplicate edit forms and ensuring proper function naming consistency (handleUpdateReadyVehicle).

**Configurable Global CC Email System (August 2025)**: Implemented fully configurable CC address management system replacing hardcoded info@momtazchem.com. Created global_email_settings database table with proper SQL schema and API endpoints for managing CC addresses. Enhanced Email Control Panel with intuitive add/remove interface for CC addresses, allowing real-time configuration updates. System now supports multiple CC addresses with JSON storage and automatic synchronization across all email services. UI provides clear visualization of configured addresses with individual delete functionality and email validation. Database changes persist across sessions with proper error handling and toast notifications for user feedback.

**Complete Footer Management System (August 2025)**: Implemented comprehensive footer content management system with dedicated database table (footer_settings) and full CRUD API endpoints. Created intuitive admin interface at /admin/footer-management with support for multi-language settings, social media links (including WeChat with QR code support), company information, and customizable link sections. Footer component completely rebuilt to consume dynamic settings from database instead of hardcoded values. System supports configurable visibility toggles for different footer sections and maintains proper state management across language switches.

**Optional Customer Data Preservation in Production Reset (August 2025)**: Enhanced production reset functionality to make customer data deletion completely optional. Added `preserveCustomers` parameter to reset endpoint allowing selective data preservation. Implemented intuitive checkbox in confirmation modal with real-time visual feedback showing which data will be preserved or deleted. When enabled, customer and customer_addresses tables are preserved while all operational data (orders, transactions, logs) is still cleared. System provides clear messaging and logging to indicate whether customers were preserved during reset operation.

**Shop Price Range Filter Optimization (August 2025)**: Completely optimized price range filter in shop functionality for better user experience. Fixed RangeSlider component with separated handlers for visual feedback (onValueChange) and filter application (onValueCommit). Enhanced slider with improved visual feedback including larger thumbs, better colors, live value display below slider, and formatted currency values. Updated shop interface with Persian labels and proper step values. Price filter now applies changes only when user releases mouse (onValueCommit) instead of real-time updates during dragging, reducing unnecessary API calls and improving performance. Added separate handlers for immediate visual feedback and final filter application.

### System Design Choices
The architecture emphasizes modularity and scalability, utilizing a RESTful API for backend-frontend communication and ensuring separation of concerns. Data integrity is maintained through transactional operations and a prevention-first approach. A unified vehicle selection algorithm prioritizes cost-efficiency and safety. Inventory management strictly adheres to FIFO principles. A comprehensive email and SMS automation system leverages templates and intelligent routing. The system is designed for continuous integration and deployment, with performance optimization through database indexing, caching, and asset optimization. All React Portal usage has been eliminated to resolve `removeChild` errors, with modals now rendering directly in the component tree.

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