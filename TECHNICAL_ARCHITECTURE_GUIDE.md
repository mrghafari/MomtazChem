# راهنمای معماری فنی پلتفرم | Technical Architecture Guide

## فهرست مطالب | Table of Contents

### بخش فارسی | Persian Section
1. [معماری کلی سیستم](#معماری-کلی-سیستم)
2. [جزئیات فنی Frontend](#جزئیات-فنی-frontend)
3. [جزئیات فنی Backend](#جزئیات-فنی-backend)
4. [ساختار پایگاه داده](#ساختار-پایگاه-داده)
5. [API Documentation](#api-documentation)
6. [Performance & Security](#performance--security)

### English Section
1. [System Overview](#system-overview)
2. [Frontend Technical Details](#frontend-technical-details)
3. [Backend Technical Details](#backend-technical-details)
4. [Database Structure](#database-structure)
5. [API Documentation](#api-documentation-en)
6. [Performance & Security](#performance--security-en)

---

## بخش فارسی | Persian Section

## معماری کلی سیستم

### نمای کلی Architecture Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  React.js + TypeScript + Tailwind CSS + Shadcn/UI         │
│  ├── Routing: Wouter                                       │
│  ├── State: TanStack Query + React Hook Form              │
│  ├── Authentication: Session-based                         │
│  └── Internationalization: 4 Languages                    │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                        │
│              Express.js REST API                           │
│  ├── Authentication Middleware                             │
│  ├── Rate Limiting                                         │
│  ├── CORS Configuration                                    │
│  └── Request Validation                                    │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                      │
│               Node.js + TypeScript                         │
│  ├── Order Processing Engine                               │
│  ├── Logistics Optimization Algorithm                      │
│  ├── CRM Analytics Engine                                  │
│  ├── Safety Compliance System                              │
│  └── Email/Notification Services                           │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                        │
│              Drizzle ORM + PostgreSQL                      │
│  ├── Customer Data Management                              │
│  ├── Product & Inventory                                   │
│  ├── Order & Transaction Processing                        │
│  ├── Geographic & Logistics Data                           │
│  └── Content & Configuration                               │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                      │
│            Neon Cloud PostgreSQL Database                  │
│  ├── Automated Backups                                     │
│  ├── Connection Pooling                                    │
│  ├── Performance Monitoring                                │
│  └── Security & Encryption                                 │
└─────────────────────────────────────────────────────────────┘
```

## جزئیات فنی Frontend

### Component Architecture
```typescript
src/
├── components/
│   ├── ui/               // Shadcn/UI Base Components
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   ├── dialog.tsx
│   │   └── table.tsx
│   ├── layout/           // Layout Components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── sidebar.tsx
│   ├── forms/            // Business Forms
│   │   ├── customer-registration.tsx
│   │   ├── product-form.tsx
│   │   └── order-form.tsx
│   └── business/         // Business Logic Components
│       ├── product-catalog.tsx
│       ├── shopping-cart.tsx
│       └── order-tracking.tsx
├── pages/
│   ├── admin/            // Admin Panel Pages
│   │   ├── dashboard.tsx
│   │   ├── product-management.tsx
│   │   ├── order-management.tsx
│   │   ├── crm.tsx
│   │   └── logistics-management.tsx
│   ├── customer/         // Customer Pages
│   │   ├── profile.tsx
│   │   ├── orders.tsx
│   │   └── wallet.tsx
│   └── public/           // Public Pages
│       ├── home.tsx
│       ├── shop.tsx
│       └── product-detail.tsx
├── lib/
│   ├── auth.ts           // Authentication Logic
│   ├── api.ts            // API Client
│   ├── utils.ts          // Utility Functions
│   └── validation.ts     // Form Validation Schemas
└── hooks/
    ├── useAuth.ts        // Authentication Hook
    ├── useCart.ts        // Shopping Cart Hook
    └── useLocalStorage.ts // Local Storage Hook
```

### State Management Strategy
- **Server State**: TanStack Query برای cache و synchronization
- **Client State**: React useState و useReducer
- **Form State**: React Hook Form با Zod validation
- **Global State**: Context API برای authentication و theme
- **Persistent State**: localStorage برای cart و preferences

### Performance Optimizations
- **Code Splitting**: React.lazy و Suspense
- **Image Optimization**: WebP format و lazy loading
- **Bundle Optimization**: Tree shaking و minification
- **Caching Strategy**: React Query cache policies
- **Virtual Scrolling**: برای لیست‌های بزرگ

## جزئیات فنی Backend

### API Architecture
```typescript
server/
├── routes/
│   ├── auth.ts           // Authentication Routes
│   ├── products.ts       // Product Management
│   ├── orders.ts         // Order Processing
│   ├── customers.ts      // Customer Management
│   ├── logistics.ts      // Logistics & Shipping
│   ├── crm.ts           // CRM Functionality
│   ├── admin.ts         // Admin Operations
│   └── webhooks.ts      // External Integrations
├── middleware/
│   ├── auth.ts          // Authentication Middleware
│   ├── validation.ts    // Request Validation
│   ├── rateLimit.ts     // Rate Limiting
│   ├── cors.ts          // CORS Configuration
│   └── errorHandler.ts  // Error Handling
├── services/
│   ├── emailService.ts  // Email Automation
│   ├── pdfService.ts    // PDF Generation
│   ├── logisticsEngine.ts // Shipping Algorithm
│   ├── crmAnalytics.ts  // CRM Analytics
│   └── inventoryService.ts // Inventory Management
├── storage/
│   ├── customer-storage.ts
│   ├── product-storage.ts
│   ├── order-storage.ts
│   ├── crm-storage.ts
│   └── content-storage.ts
└── utils/
    ├── security.ts      // Security Utilities
    ├── helpers.ts       // Helper Functions
    └── constants.ts     // Application Constants
```

### Advanced Features Implementation

#### 1. Smart Vehicle Selection Algorithm
```typescript
interface VehicleOptimization {
  calculateOptimalVehicle(
    weight: number,
    destination: string,
    isFlammable: boolean
  ): Promise<{
    selectedVehicle: Vehicle;
    totalCost: number;
    estimatedTime: string;
    route: string[];
  }>;
}

// الگوریتم بهینه‌سازی شامل:
// - محاسبه ظرفیت وزن
// - محاسبه مسافت و هزینه سوخت
// - اعمال قوانین ایمنی
// - انتخاب ارزان‌ترین گزینه
```

#### 2. Safety Compliance System
```typescript
interface SafetyCompliance {
  validateFlammableMaterials(products: Product[]): boolean;
  getAuthorizedVehicles(materialType: MaterialType): Vehicle[];
  generateSafetyReport(order: Order): SafetyReport;
}

// سیستم safety شامل:
// - تشخیص مواد آتش‌زا
// - فیلتر خودروهای مجاز
// - گزارش‌گیری ایمنی
```

#### 3. Real-time Inventory Management
```typescript
interface InventoryService {
  updateStock(productId: number, quantity: number): Promise<void>;
  checkAvailability(productId: number): Promise<number>;
  generateLowStockAlert(): Promise<Alert[]>;
  syncWithWarehouse(): Promise<SyncResult>;
}
```

## ساختار پایگاه داده

### Core Tables Schema

#### 1. User Management
```sql
-- کاربران سیستم
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- نقش‌های کاربری
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL
);
```

#### 2. Product Management
```sql
-- محصولات
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  technical_name VARCHAR(255),
  category_id INTEGER REFERENCES categories(id),
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  weight_kg DECIMAL(8,3),
  is_flammable BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- دسته‌بندی محصولات
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true
);
```

#### 3. Order Management
```sql
-- سفارشات مشتریان
CREATE TABLE customer_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  total_amount DECIMAL(12,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  status order_status_enum DEFAULT 'pending',
  payment_status payment_status_enum DEFAULT 'pending',
  shipping_address TEXT,
  delivery_method VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جزئیات اقلام سفارش
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES customer_orders(id),
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL
);
```

#### 4. CRM System
```sql
-- مشتریان CRM
CREATE TABLE crm_customers (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  company_name VARCHAR(255),
  industry VARCHAR(100),
  annual_revenue DECIMAL(15,2),
  employee_count INTEGER,
  lead_source VARCHAR(100),
  customer_tier tier_enum DEFAULT 'bronze',
  address TEXT,
  city_region VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  website VARCHAR(255),
  tax_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. Logistics System
```sql
-- شهرهای عراق
CREATE TABLE iraqi_cities (
  id SERIAL PRIMARY KEY,
  name_arabic VARCHAR(255) NOT NULL,
  name_english VARCHAR(255),
  province VARCHAR(100) NOT NULL,
  distance_from_erbil_km INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  has_intercity_bus_line BOOLEAN DEFAULT false
);

-- قالب‌های خودرو
CREATE TABLE vehicle_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  vehicle_type VARCHAR(100) NOT NULL,
  max_weight_kg INTEGER NOT NULL,
  max_volume_m3 DECIMAL(8,2),
  base_price DECIMAL(10,2) NOT NULL,
  price_per_km DECIMAL(8,2) NOT NULL,
  average_speed_kmh INTEGER DEFAULT 60,
  fuel_consumption_l_100km DECIMAL(5,2),
  supports_flammable BOOLEAN DEFAULT false,
  route_types TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true
);
```

### Database Relationships
```
Users ──→ Customers ──→ Orders ──→ Order Items
   │         │            │
   │         └─→ CRM ──────┘
   │
   └─→ Admin Functions ──→ Product Management
                        │
                        └─→ Logistics Management
```

## API Documentation

### Authentication APIs

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response:
{
  "success": true,
  "token": "string",
  "user": {
    "id": number,
    "username": "string",
    "role": "string"
  }
}
```

### Product APIs

#### Get Products
```http
GET /api/products?category=1&search=chemical
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Chemical Product",
      "price": 100.00,
      "stock": 50,
      "isFlammable": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### Create Product
```http
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Product",
  "categoryId": 1,
  "price": 150.00,
  "weight": 2.5,
  "isFlammable": false,
  "description": "Product description"
}
```

### Order APIs

#### Create Order
```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 100.00
    }
  ],
  "shippingAddress": "Customer address",
  "deliveryMethod": "smart_vehicle"
}
```

#### Get Order Details
```http
GET /api/orders/{orderId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "M2511001",
    "status": "confirmed",
    "totalAmount": 200.00,
    "items": [...],
    "customer": {...}
  }
}
```

### Logistics APIs

#### Calculate Delivery Cost
```http
POST /api/calculate-delivery-cost
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "weight": 5.0
    }
  ],
  "destination": "Baghdad",
  "deliveryMethod": "smart_vehicle"
}

Response:
{
  "success": true,
  "selectedVehicle": "Light Truck",
  "totalCost": 50000,
  "estimatedTime": "2-3 days",
  "route": "Erbil → Baghdad"
}
```

## Performance & Security

### Performance Optimizations

#### Database Performance
- **Indexing Strategy**: Indexes روی کلیدهای اصلی
- **Query Optimization**: استفاده از prepared statements
- **Connection Pooling**: مدیریت اتصالات database
- **Caching Layer**: Redis برای cache داده‌های پرتکرار

#### Application Performance
- **Code Splitting**: بارگذاری lazy components
- **API Response Compression**: فشرده‌سازی response ها
- **Image Optimization**: WebP format و CDN
- **Database Query Optimization**: Efficient queries

### Security Measures

#### Authentication & Authorization
- **JWT Tokens**: Token-based authentication
- **Role-Based Access**: RBAC system
- **Session Management**: Secure session handling
- **Password Security**: Bcrypt hashing

#### Data Security
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: CSRF tokens

#### Infrastructure Security
- **HTTPS Enforcement**: SSL/TLS encryption
- **Rate Limiting**: API rate limiting
- **CORS Configuration**: Proper CORS setup
- **Environment Variables**: Secure config management

---

## English Section

## System Overview

### Technology Stack
- **Frontend**: React.js 18+ with TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI components
- **State Management**: TanStack Query + React Hook Form
- **Routing**: Wouter for lightweight routing
- **Backend**: Express.js + Node.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with secure cookies
- **Deployment**: Cloud-based infrastructure

### Key Architecture Principles
1. **Separation of Concerns**: Clear separation between layers
2. **Type Safety**: Full TypeScript coverage
3. **Performance First**: Optimized for speed and efficiency
4. **Security by Design**: Built-in security measures
5. **Scalability**: Designed for horizontal scaling
6. **Maintainability**: Clean, documented code

## Frontend Technical Details

### Component Design System
- **Base Components**: Shadcn/UI for consistency
- **Composite Components**: Business logic components
- **Layout Components**: Reusable layout structures
- **Form Components**: Validated form inputs
- **Data Display**: Tables, lists, and cards

### State Management Architecture
- **Server State**: TanStack Query for API data
- **Client State**: React hooks for local state
- **Form State**: React Hook Form with validation
- **Global State**: Context for shared data
- **Persistent State**: localStorage for user preferences

## Backend Technical Details

### API Design Principles
- **RESTful Design**: Standard REST conventions
- **Consistent Responses**: Uniform response format
- **Error Handling**: Comprehensive error management
- **Documentation**: OpenAPI/Swagger documentation
- **Versioning**: API version management

### Business Logic Implementation
- **Service Layer**: Business logic separation
- **Data Access Layer**: Database abstraction
- **Validation Layer**: Input validation
- **Authentication Layer**: Security implementation
- **Notification Layer**: Email and SMS services

## Database Structure

### Schema Design Principles
- **Normalization**: Proper database normalization
- **Indexing**: Strategic index placement
- **Constraints**: Data integrity constraints
- **Relationships**: Proper foreign key relationships
- **Performance**: Optimized for read/write operations

### Data Models
- **User Management**: Authentication and authorization
- **Product Catalog**: Product and inventory management
- **Order Processing**: Order lifecycle management
- **Customer Relationship**: CRM and analytics
- **Logistics**: Shipping and delivery management

## API Documentation (EN)

### Standard Response Format
```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "errors": string[],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number
  }
}
```

### Error Handling
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters"
  ]
}
```

## Performance & Security (EN)

### Performance Metrics
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Database Query Time**: < 100ms
- **Bundle Size**: < 1MB compressed
- **Lighthouse Score**: > 90

### Security Compliance
- **OWASP Top 10**: Full compliance
- **Data Protection**: GDPR-ready
- **Industry Standards**: Chemical industry compliance
- **Regular Audits**: Security assessments
- **Monitoring**: Real-time security monitoring

---

## Deployment & DevOps

### Development Workflow
```bash
# Development Setup
npm install
npm run dev

# Production Build
npm run build
npm run start

# Database Management
npm run db:push
npm run db:studio
```

### Environment Configuration
```env
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# Email Service
SMTP_HOST=your-smtp-host
SMTP_USER=your-email
SMTP_PASS=your-password

# File Storage
UPLOAD_PATH=./uploads
```

### Monitoring & Analytics
- **Application Performance**: Real-time monitoring
- **Database Performance**: Query analysis
- **User Analytics**: Behavior tracking
- **Business Metrics**: Sales and conversion tracking
- **Error Tracking**: Automated error reporting

---

## نتیجه‌گیری | Conclusion

این راهنمای فنی نمای کاملی از معماری و پیاده‌سازی پلتفرم ارائه می‌دهد. سیستم با استفاده از تکنولوژی‌های مدرن و بهترین practices صنعت، راه‌حلی قابل اعتماد و مقیاس‌پذیر برای کسب‌وکارهای شیمیایی فراهم می‌کند.

This technical guide provides a complete overview of the platform's architecture and implementation. The system uses modern technologies and industry best practices to provide a reliable and scalable solution for chemical businesses.

---

**نسخه | Version**: 1.0  
**تاریخ آخرین به‌روزرسانی | Last Updated**: January 28, 2025