import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

// Documentation data structures
interface DocumentationSection {
  title: string;
  content: string;
  subsections?: DocumentationSection[];
}

interface DocumentationData {
  title: string;
  sections: DocumentationSection[];
}

// User Documentation Data
const userDocumentationEN: DocumentationData = {
  title: "Momtazchem Chemical Solutions Platform - User Guide",
  sections: [
    {
      title: "Introduction",
      content: "Welcome to Momtazchem Chemical Solutions Platform, your comprehensive source for high-quality chemical products and solutions. Our platform provides a complete e-commerce experience with multilingual support (English, Arabic, Kurdish, Turkish) and professional customer service.",
      subsections: [
        {
          title: "Platform Overview",
          content: "Our platform combines a public showcase website with a full e-commerce system, featuring product catalogs, customer accounts, order management, and integrated payment processing for the Iraqi market."
        },
        {
          title: "Key Features",
          content: "• Multilingual interface (4 languages)\n• Professional product catalog with detailed specifications\n• Customer account management with digital wallet\n• Real-time order tracking\n• AI-powered product recommendations\n• Secure payment processing\n• Live chat support"
        }
      ]
    },
    {
      title: "Getting Started",
      content: "This section covers the basics of using our platform, from browsing products to placing your first order.",
      subsections: [
        {
          title: "Creating Your Account",
          content: "1. Click 'Login' button in the top navigation\n2. Select 'Create Account' option\n3. Fill in required information:\n   - First Name and Last Name\n   - Email Address\n   - Phone Number (required)\n   - Country and City (required)\n   - Complete Address (required)\n   - Password (minimum 8 characters)\n4. Click 'Create Account' to complete registration\n5. Check your email for verification link"
        },
        {
          title: "Browsing Products",
          content: "Navigate through our product catalog using:\n• Main navigation menu with category filters\n• Search functionality with advanced filters\n• Product category pages (Paint & Solvents, Industrial Chemicals, etc.)\n• AI-powered product recommendations\n• Filter by price range, availability, and specifications"
        },
        {
          title: "Product Information",
          content: "Each product page includes:\n• Detailed product description and specifications\n• High-quality product images\n• Pricing information in multiple currencies\n• Stock availability status\n• Related products and alternatives\n• Customer reviews and ratings"
        }
      ]
    },
    {
      title: "Shopping & Orders",
      content: "Complete guide to placing orders and managing your purchases on our platform.",
      subsections: [
        {
          title: "Adding Products to Cart",
          content: "1. Browse or search for desired products\n2. Click on product to view details\n3. Select quantity using quantity selector\n4. Click 'Add to Cart' button\n5. Cart icon will update with item count and total\n6. Continue shopping or proceed to checkout"
        },
        {
          title: "Checkout Process",
          content: "1. Click cart icon to review items\n2. Verify quantities and remove unwanted items\n3. Click 'Proceed to Checkout'\n4. Review shipping information\n5. Select payment method (Iraqi banks supported)\n6. Review order summary and total cost\n7. Click 'Place Order' to complete purchase"
        },
        {
          title: "Order Tracking",
          content: "Track your orders through three stages:\n• Financial Department: Payment processing and verification\n• Warehouse: Order preparation and packaging\n• Logistics: Shipping and delivery coordination\n\nYou'll receive SMS notifications at each stage with tracking information."
        },
        {
          title: "Payment Methods",
          content: "We support major Iraqi banking systems:\n• Rasheed Bank transfers\n• Al-Rafidain Bank transfers\n• Trade Bank of Iraq transfers\n• Digital wallet top-up options\n• Cash on delivery (selected areas)"
        }
      ]
    },
    {
      title: "Customer Account Features",
      content: "Manage your account settings, orders, and preferences through your customer portal.",
      subsections: [
        {
          title: "Profile Management",
          content: "Update your personal information:\n• Contact details (phone, email, address)\n• Business information (company name, tax ID)\n• Communication preferences\n• Language selection\n• Password changes"
        },
        {
          title: "Digital Wallet",
          content: "Your digital wallet allows:\n• Adding funds for future purchases\n• Viewing transaction history\n• Requesting balance top-ups\n• Automatic payment processing\n• Wallet balance display in header"
        },
        {
          title: "Order History",
          content: "Access complete order information:\n• Order details and status\n• Download invoices in Arabic/English\n• Track shipment progress\n• Reorder previous purchases\n• Contact support for order issues"
        },
        {
          title: "Address Management",
          content: "Manage multiple delivery addresses:\n• Add new shipping addresses\n• Set default delivery location\n• Update existing addresses\n• GPS coordinates for accurate delivery"
        }
      ]
    },
    {
      title: "Product Categories",
      content: "Our comprehensive product catalog covers multiple chemical industry sectors.",
      subsections: [
        {
          title: "Water Treatment",
          content: "Specialized chemicals for water purification, treatment, and quality control including coagulants, flocculants, pH adjusters, and disinfectants."
        },
        {
          title: "Fuel Additives",
          content: "Advanced fuel enhancement products including octane boosters, fuel stabilizers, anti-knock compounds, and engine performance enhancers."
        },
        {
          title: "Paint & Solvents",
          content: "High-quality paints, primers, solvents, and surface treatment products for industrial and commercial applications."
        },
        {
          title: "Industrial Chemicals",
          content: "Raw materials and specialty chemicals for manufacturing, including acids, bases, catalysts, and process chemicals."
        },
        {
          title: "Agricultural Products",
          content: "Crop protection chemicals, soil conditioners, and agricultural enhancement products for improved yields."
        },
        {
          title: "Agricultural Fertilizers",
          content: "Complete range of fertilizers including NPK compounds, micronutrients, and soil amendment products."
        },
        {
          title: "Technical Equipment",
          content: "Laboratory equipment, testing instruments, and technical tools for quality control and analysis."
        },
        {
          title: "Commercial Goods",
          content: "General chemical products for commercial use including cleaning agents, maintenance chemicals, and facility management products."
        }
      ]
    },
    {
      title: "Support & Contact",
      content: "Get help when you need it through our comprehensive support system.",
      subsections: [
        {
          title: "Live Chat Support",
          content: "Access instant help through our integrated live chat system:\n• Available during business hours\n• Multi-language support\n• Technical assistance\n• Order support\n• Product recommendations"
        },
        {
          title: "Contact Information",
          content: "Reach us through multiple channels:\n• Phone: Available through website contact page\n• Email: info@momtazchem.com\n• Address: Complete address on contact page\n• Business Hours: Monday-Friday 8:00 AM - 6:00 PM\n• Social Media: Follow us on LinkedIn, Facebook, Instagram"
        },
        {
          title: "Frequently Asked Questions",
          content: "Common questions and answers:\n• Account creation and verification\n• Payment processing and methods\n• Shipping and delivery information\n• Product specifications and applications\n• Returns and exchanges policy\n• Technical support procedures"
        }
      ]
    }
  ]
};

const userDocumentationFA: DocumentationData = {
  title: "راهنمای کامل پلتفرم راه‌حل‌های شیمیایی ممتازکم",
  sections: [
    {
      title: "مقدمه",
      content: "به پلتفرم راه‌حل‌های شیمیایی ممتازکم خوش آمدید، منبع جامع شما برای محصولات و راه‌حل‌های شیمیایی باکیفیت. پلتفرم ما تجربه کاملی از تجارت الکترونیک با پشتیبانی چندزبانه (انگلیسی، عربی، کردی، ترکی) و خدمات مشتریان حرفه‌ای ارائه می‌دهد.",
      subsections: [
        {
          title: "نمای کلی پلتفرم",
          content: "پلتفرم ما وب‌سایت نمایشگاهی عمومی را با سیستم تجارت الکترونیک کامل ترکیب می‌کند که شامل کاتالوگ محصولات، مدیریت حساب مشتریان، مدیریت سفارشات و پردازش پرداخت یکپارچه برای بازار عراق است."
        },
        {
          title: "ویژگی‌های کلیدی",
          content: "• رابط چندزبانه (4 زبان)\n• کاتالوگ محصولات حرفه‌ای با مشخصات تفصیلی\n• مدیریت حساب مشتری با کیف پول دیجیتال\n• ردیابی سفارش در زمان واقعی\n• توصیه‌های محصول مبتنی بر هوش مصنوعی\n• پردازش پرداخت امن\n• پشتیبانی چت زنده"
        }
      ]
    },
    {
      title: "شروع کار",
      content: "این بخش اصول اولیه استفاده از پلتفرم ما را از مرور محصولات تا ثبت اولین سفارش شما پوشش می‌دهد.",
      subsections: [
        {
          title: "ایجاد حساب کاربری",
          content: "1. روی دکمه 'ورود' در نوار ناوبری بالا کلیک کنید\n2. گزینه 'ایجاد حساب' را انتخاب کنید\n3. اطلاعات مورد نیاز را پر کنید:\n   - نام و نام خانوادگی\n   - آدرس ایمیل\n   - شماره تلفن (اجباری)\n   - کشور و شهر (اجباری)\n   - آدرس کامل (اجباری)\n   - رمز عبور (حداقل 8 کاراکتر)\n4. روی 'ایجاد حساب' کلیک کنید تا ثبت‌نام کامل شود\n5. ایمیل خود را برای لینک تأیید بررسی کنید"
        },
        {
          title: "مرور محصولات",
          content: "از طریق کاتالوگ محصولات ما با استفاده از:\n• منوی ناوبری اصلی با فیلترهای دسته‌بندی\n• عملکرد جستجو با فیلترهای پیشرفته\n• صفحات دسته‌بندی محصولات (رنگ و حلال، مواد شیمیایی صنعتی، و غیره)\n• توصیه‌های محصول مبتنی بر هوش مصنوعی\n• فیلتر بر اساس محدوده قیمت، دسترسی و مشخصات"
        },
        {
          title: "اطلاعات محصول",
          content: "هر صفحه محصول شامل:\n• توضیحات و مشخصات تفصیلی محصول\n• تصاویر باکیفیت محصول\n• اطلاعات قیمت در چندین ارز\n• وضعیت موجودی انبار\n• محصولات مرتبط و جایگزین\n• نظرات و امتیازات مشتریان"
        }
      ]
    },
    {
      title: "خرید و سفارشات",
      content: "راهنمای کامل برای ثبت سفارش و مدیریت خریدهای شما در پلتفرم ما.",
      subsections: [
        {
          title: "افزودن محصولات به سبد خرید",
          content: "1. محصولات مورد نظر را مرور یا جستجو کنید\n2. روی محصول کلیک کنید تا جزئیات را مشاهده کنید\n3. تعداد را با استفاده از انتخابگر تعداد انتخاب کنید\n4. روی دکمه 'افزودن به سبد خرید' کلیک کنید\n5. آیکون سبد خرید با تعداد آیتم و مجموع به‌روزرسانی می‌شود\n6. به خرید ادامه دهید یا به تسویه حساب بروید"
        },
        {
          title: "فرآیند تسویه حساب",
          content: "1. روی آیکون سبد خرید کلیک کنید تا آیتم‌ها را بررسی کنید\n2. تعداد را تأیید کنید و آیتم‌های ناخواسته را حذف کنید\n3. روی 'ادامه به تسویه حساب' کلیک کنید\n4. اطلاعات حمل و نقل را بررسی کنید\n5. روش پرداخت را انتخاب کنید (بانک‌های عراقی پشتیبانی می‌شوند)\n6. خلاصه سفارش و هزینه کل را بررسی کنید\n7. روی 'ثبت سفارش' کلیک کنید تا خرید کامل شود"
        },
        {
          title: "ردیابی سفارش",
          content: "سفارشات خود را از طریق سه مرحله ردیابی کنید:\n• بخش مالی: پردازش و تأیید پرداخت\n• انبار: آماده‌سازی و بسته‌بندی سفارش\n• لجستیک: هماهنگی حمل و نقل و تحویل\n\nشما در هر مرحله اعلان پیامکی با اطلاعات ردیابی دریافت خواهید کرد."
        },
        {
          title: "روش‌های پرداخت",
          content: "ما از سیستم‌های بانکی اصلی عراق پشتیبانی می‌کنیم:\n• انتقال بانک رشید\n• انتقال بانک الرافدین\n• انتقال بانک التجاره العراقی\n• گزینه‌های شارژ کیف پول دیجیتال\n• پرداخت نقدی در محل تحویل (مناطق منتخب)"
        }
      ]
    },
    {
      title: "ویژگی‌های حساب مشتری",
      content: "تنظیمات حساب، سفارشات و تنظیمات برگزیده خود را از طریق پورتال مشتری مدیریت کنید.",
      subsections: [
        {
          title: "مدیریت پروفایل",
          content: "اطلاعات شخصی خود را به‌روزرسانی کنید:\n• جزئیات تماس (تلفن، ایمیل، آدرس)\n• اطلاعات کسب‌وکار (نام شرکت، شناسه مالیاتی)\n• تنظیمات برگزیده ارتباطات\n• انتخاب زبان\n• تغییر رمز عبور"
        },
        {
          title: "کیف پول دیجیتال",
          content: "کیف پول دیجیتال شما امکان:\n• افزودن وجه برای خریدهای آتی\n• مشاهده تاریخچه تراکنش‌ها\n• درخواست شارژ موجودی\n• پردازش پرداخت خودکار\n• نمایش موجودی کیف پول در هدر"
        },
        {
          title: "تاریخچه سفارشات",
          content: "دسترسی به اطلاعات کامل سفارش:\n• جزئیات و وضعیت سفارش\n• دانلود فاکتورها به زبان عربی/انگلیسی\n• ردیابی پیشرفت حمل و نقل\n• سفارش مجدد خریدهای قبلی\n• تماس با پشتیبانی برای مسائل سفارش"
        },
        {
          title: "مدیریت آدرس",
          content: "مدیریت چندین آدرس تحویل:\n• افزودن آدرس‌های حمل و نقل جدید\n• تنظیم مکان تحویل پیش‌فرض\n• به‌روزرسانی آدرس‌های موجود\n• مختصات GPS برای تحویل دقیق"
        }
      ]
    },
    {
      title: "دسته‌بندی محصولات",
      content: "کاتالوگ جامع محصولات ما بخش‌های متعدد صنعت شیمیایی را پوشش می‌دهد.",
      subsections: [
        {
          title: "تصفیه آب",
          content: "مواد شیمیایی تخصصی برای تصفیه آب، تصفیه و کنترل کیفیت شامل کواگولانت‌ها، فلوکولانت‌ها، تنظیم‌کننده‌های pH و ضدعفونی‌کننده‌ها."
        },
        {
          title: "افزودنی‌های سوخت",
          content: "محصولات پیشرفته بهبود سوخت شامل تقویت‌کننده‌های اکتان، تثبیت‌کننده‌های سوخت، ترکیبات ضد ضربه و بهبوددهنده‌های عملکرد موتور."
        },
        {
          title: "رنگ و حلال",
          content: "رنگ‌ها، پرایمرها، حلال‌ها و محصولات تصفیه سطح باکیفیت برای کاربردهای صنعتی و تجاری."
        },
        {
          title: "مواد شیمیایی صنعتی",
          content: "مواد خام و مواد شیمیایی تخصصی برای تولید، شامل اسیدها، بازها، کاتالیزورها و مواد شیمیایی فرآیند."
        },
        {
          title: "محصولات کشاورزی",
          content: "مواد شیمیایی محافظت از محصولات، تقویت‌کننده‌های خاک و محصولات بهبود کشاورزی برای بهبود عملکرد."
        },
        {
          title: "کودهای کشاورزی",
          content: "مجموعه کاملی از کودها شامل ترکیبات NPK، ریزمغذی‌ها و محصولات اصلاح خاک."
        },
        {
          title: "تجهیزات فنی",
          content: "تجهیزات آزمایشگاهی، ابزارهای تست و ابزارهای فنی برای کنترل کیفیت و تجزیه و تحلیل."
        },
        {
          title: "کالاهای تجاری",
          content: "محصولات شیمیایی عمومی برای استفاده تجاری شامل عوامل تمیزکننده، مواد شیمیایی نگهداری و محصولات مدیریت تأسیسات."
        }
      ]
    },
    {
      title: "پشتیبانی و تماس",
      content: "کمک بگیرید وقتی که نیاز دارید از طریق سیستم پشتیبانی جامع ما.",
      subsections: [
        {
          title: "پشتیبانی چت زنده",
          content: "دسترسی به کمک فوری از طریق سیستم چت زنده یکپارچه ما:\n• در ساعات کاری در دسترس\n• پشتیبانی چندزبانه\n• کمک فنی\n• پشتیبانی سفارش\n• توصیه‌های محصول"
        },
        {
          title: "اطلاعات تماس",
          content: "از طریق کانال‌های متعدد با ما تماس بگیرید:\n• تلفن: از طریق صفحه تماس وب‌سایت در دسترس\n• ایمیل: info@momtazchem.com\n• آدرس: آدرس کامل در صفحه تماس\n• ساعات کاری: دوشنبه تا جمعه 8:00 صبح - 6:00 عصر\n• رسانه‌های اجتماعی: ما را در لینکدین، فیسبوک، اینستاگرام دنبال کنید"
        },
        {
          title: "سوالات متداول",
          content: "سوالات و پاسخ‌های رایج:\n• ایجاد و تأیید حساب\n• پردازش و روش‌های پرداخت\n• اطلاعات حمل و نقل و تحویل\n• مشخصات و کاربردهای محصول\n• سیاست برگشت و تعویض\n• رویه‌های پشتیبانی فنی"
        }
      ]
    }
  ]
};

// Admin Documentation Data
const adminDocumentationEN: DocumentationData = {
  title: "Momtazchem Platform - Administrator Guide",
  sections: [
    {
      title: "Admin Dashboard Overview",
      content: "The administrator dashboard provides centralized access to all platform management functions through the Site Management interface.",
      subsections: [
        {
          title: "Site Management Hub",
          content: "The Site Management page serves as the central hub for all administrative functions, featuring 25+ integrated tools organized in a drag-and-drop Quick Actions layout. All administrative tasks are accessible from this unified interface."
        },
        {
          title: "Authentication",
          content: "Admin access requires proper authentication:\n• Username: Omid Mohammad\n• Password: admin123\n• Two-factor authentication available\n• Session management with timeout protection"
        }
      ]
    },
    {
      title: "Content Management System",
      content: "Comprehensive content management for the multilingual website with 430+ content items across 4 languages.",
      subsections: [
        {
          title: "Dynamic Content Management",
          content: "Manage all website content dynamically:\n• 430+ multilingual content items\n• 12 content sections (Home, About, Contact, Services, etc.)\n• 4 language support (English, Arabic, Kurdish, Turkish)\n• RTL/LTR text direction handling\n• Real-time content updates"
        },
        {
          title: "Social Media Management",
          content: "Configure social media links across 6 platforms:\n• LinkedIn, Twitter, Facebook, Instagram, TikTok, WhatsApp\n• Dynamic URL management through Content Management\n• Multi-language social media content\n• Footer integration with automatic updates"
        },
        {
          title: "Image Asset Management",
          content: "Organize and manage visual assets:\n• Upload images by section\n• Organize assets by content categories\n• Optimize images for web performance\n• Bulk upload and management tools"
        }
      ]
    },
    {
      title: "Product Management",
      content: "Comprehensive product catalog management with both showcase and e-commerce functionality.",
      subsections: [
        {
          title: "Showcase Products",
          content: "Manage display-only products:\n• Product variants with parent-child relationships\n• Detailed specifications and descriptions\n• Image galleries and documentation\n• Category organization"
        },
        {
          title: "Shop Products",
          content: "Full e-commerce product management:\n• Pricing and inventory tracking\n• EAN-13 barcode system\n• Stock levels and alerts\n• Discount management\n• Multi-currency support"
        },
        {
          title: "Barcode Management",
          content: "Professional GS1-compliant EAN-13 barcode system:\n• Iraq country code (864) integration\n• Momtazchem company code (96771)\n• Automated barcode generation\n• Batch processing capabilities\n• Inventory integration"
        },
        {
          title: "Category Management",
          content: "Standardized product categorization:\n• 9 main categories (Water Treatment, Fuel Additives, etc.)\n• Hierarchical organization\n• Category-based email routing\n• SEO optimization per category"
        }
      ]
    },
    {
      title: "Customer & CRM Management",
      content: "Advanced customer relationship management with unified customer data and analytics.",
      subsections: [
        {
          title: "Unified Customer System",
          content: "Single CRM system for all customer data:\n• Automated migration from legacy systems\n• Customer segmentation and analytics\n• Activity tracking and logging\n• Purchase history and metrics"
        },
        {
          title: "Customer Analytics",
          content: "Comprehensive customer insights:\n• Purchase behavior analysis\n• Geographic distribution\n• Customer lifetime value\n• Segmentation by activity and spending\n• PDF report generation"
        },
        {
          title: "Digital Wallet Management",
          content: "Customer balance and payment management:\n• Wallet balance tracking\n• Recharge request approvals\n• Transaction history\n• Payment method integration"
        }
      ]
    },
    {
      title: "Order Management System",
      content: "Three-department workflow system for order processing and fulfillment.",
      subsections: [
        {
          title: "Department Workflow",
          content: "Sequential order processing through departments:\n• Financial Department: Payment verification\n• Warehouse: Order preparation and packaging\n• Logistics: Shipping and delivery coordination\n• Automatic progression between departments"
        },
        {
          title: "Order Tracking",
          content: "Real-time order status management:\n• Status updates and notifications\n• SMS integration for customer updates\n• GPS tracking for deliveries\n• Delivery confirmation system"
        },
        {
          title: "Global Refresh Control",
          content: "Centralized refresh management:\n• Unified timing control across departments\n• Sync/individual refresh modes\n• Configurable refresh intervals\n• System-wide synchronization"
        }
      ]
    },
    {
      title: "Email Automation System",
      content: "Advanced multi-SMTP email management with intelligent routing and template system.",
      subsections: [
        {
          title: "Multi-SMTP Configuration",
          content: "Category-based email routing:\n• 8 email categories with dedicated SMTP\n• Intelligent department routing\n• Fallback configurations\n• Performance monitoring"
        },
        {
          title: "Template Management",
          content: "Advanced email template system:\n• Variable substitution\n• Personalization options\n• Multi-language templates\n• A/B testing capabilities"
        },
        {
          title: "Email Analytics",
          content: "Comprehensive email performance tracking:\n• Delivery rates and statistics\n• Open and click tracking\n• Routing performance analysis\n• Error monitoring and resolution"
        }
      ]
    },
    {
      title: "SEO & Internationalization",
      content: "Comprehensive SEO management for multilingual content and international markets.",
      subsections: [
        {
          title: "Multilingual SEO",
          content: "SEO optimization for 4 languages:\n• Meta tags and descriptions\n• Keywords and content optimization\n• hreflang implementation\n• Language-specific sitemaps"
        },
        {
          title: "Dynamic Sitemap Generation",
          content: "Automated sitemap management:\n• 47+ sitemap entries\n• Multi-language URL structure\n• Automatic updates\n• Search engine submission"
        },
        {
          title: "Robots.txt Management",
          content: "Crawling directive management:\n• Configurable robots.txt\n• Search engine optimization\n• Crawl budget management\n• Security considerations"
        }
      ]
    },
    {
      title: "AI Integration & Automation",
      content: "Artificial intelligence features for enhanced productivity and smart recommendations.",
      subsections: [
        {
          title: "AI-Powered SKU Generation",
          content: "Smart product SKU creation:\n• Category-based SKU patterns\n• Automated uniqueness validation\n• Bulk SKU generation\n• Performance monitoring"
        },
        {
          title: "Product Recommendations",
          content: "Intelligent product suggestion system:\n• Industry-based recommendations\n• Customer behavior analysis\n• Cross-selling opportunities\n• Performance analytics"
        },
        {
          title: "AI System Management",
          content: "AI performance and configuration:\n• OpenAI API integration\n• Token usage monitoring\n• Performance optimization\n• System health monitoring"
        }
      ]
    },
    {
      title: "System Administration",
      content: "Core system management, security, and maintenance functions.",
      subsections: [
        {
          title: "User Management",
          content: "Multi-role admin system:\n• Department-based access control\n• Super admin verification\n• User role assignments\n• Activity logging"
        },
        {
          title: "Database Management",
          content: "Database maintenance and backup:\n• Automated backup systems\n• Migration management\n• Performance optimization\n• Data integrity checks"
        },
        {
          title: "Security Settings",
          content: "Platform security management:\n• Authentication settings\n• Session management\n• Access control lists\n• Security monitoring"
        },
        {
          title: "Performance Monitoring",
          content: "System performance tracking:\n• Server performance metrics\n• Database query optimization\n• Cache management\n• Error monitoring"
        }
      ]
    }
  ]
};

const adminDocumentationFA: DocumentationData = {
  title: "راهنمای مدیریت پلتفرم ممتازکم",
  sections: [
    {
      title: "نمای کلی داشبورد مدیریت",
      content: "داشبورد مدیریت دسترسی متمرکز به تمام عملکردهای مدیریت پلتفرم از طریق رابط مدیریت سایت فراهم می‌کند.",
      subsections: [
        {
          title: "مرکز مدیریت سایت",
          content: "صفحه مدیریت سایت به عنوان مرکز اصلی برای تمام عملکردهای مدیریتی عمل می‌کند که دارای 25+ ابزار یکپارچه در چیدمان اقدامات سریع کشیدن و رها کردن سازماندهی شده است. تمام وظایف مدیریتی از این رابط یکپارچه قابل دسترسی هستند."
        },
        {
          title: "احراز هویت",
          content: "دسترسی مدیر نیازمند احراز هویت مناسب است:\n• نام کاربری: Omid Mohammad\n• رمز عبور: admin123\n• احراز هویت دو مرحله‌ای موجود\n• مدیریت جلسه با حفاظت از timeout"
        }
      ]
    },
    {
      title: "سیستم مدیریت محتوا",
      content: "مدیریت جامع محتوا برای وب‌سایت چندزبانه با 430+ آیتم محتوا در 4 زبان.",
      subsections: [
        {
          title: "مدیریت محتوای پویا",
          content: "مدیریت تمام محتوای وب‌سایت به صورت پویا:\n• 430+ آیتم محتوای چندزبانه\n• 12 بخش محتوا (خانه، درباره، تماس، خدمات، و غیره)\n• پشتیبانی از 4 زبان (انگلیسی، عربی، کردی، ترکی)\n• مدیریت جهت متن RTL/LTR\n• به‌روزرسانی محتوا در زمان واقعی"
        },
        {
          title: "مدیریت رسانه‌های اجتماعی",
          content: "پیکربندی لینک‌های رسانه‌های اجتماعی در 6 پلتفرم:\n• لینکدین، توییتر، فیسبوک، اینستاگرام، تیک‌تاک، واتساپ\n• مدیریت URL پویا از طریق مدیریت محتوا\n• محتوای رسانه‌های اجتماعی چندزبانه\n• یکپارچگی footer با به‌روزرسانی‌های خودکار"
        },
        {
          title: "مدیریت دارایی‌های تصویری",
          content: "سازماندهی و مدیریت دارایی‌های بصری:\n• آپلود تصاویر بر اساس بخش\n• سازماندهی دارایی‌ها بر اساس دسته‌بندی محتوا\n• بهینه‌سازی تصاویر برای عملکرد وب\n• ابزارهای آپلود و مدیریت انبوه"
        }
      ]
    },
    {
      title: "مدیریت محصولات",
      content: "مدیریت جامع کاتالوگ محصولات با عملکرد نمایشگاهی و تجارت الکترونیک.",
      subsections: [
        {
          title: "محصولات نمایشگاهی",
          content: "مدیریت محصولات تنها نمایشی:\n• انواع محصولات با روابط والد-فرزند\n• مشخصات و توضیحات تفصیلی\n• گالری تصاویر و مستندات\n• سازماندهی دسته‌بندی"
        },
        {
          title: "محصولات فروشگاه",
          content: "مدیریت کامل محصولات تجارت الکترونیک:\n• قیمت‌گذاری و ردیابی موجودی\n• سیستم بارکد EAN-13\n• سطوح موجودی و هشدارها\n• مدیریت تخفیف\n• پشتیبانی چندارزه"
        },
        {
          title: "مدیریت بارکد",
          content: "سیستم بارکد حرفه‌ای مطابق با GS1 EAN-13:\n• یکپارچگی کد کشور عراق (864)\n• کد شرکت ممتازکم (96771)\n• تولید بارکد خودکار\n• قابلیت‌های پردازش انبوه\n• یکپارچگی موجودی"
        },
        {
          title: "مدیریت دسته‌بندی",
          content: "دسته‌بندی استاندارد محصولات:\n• 9 دسته اصلی (تصفیه آب، افزودنی‌های سوخت، و غیره)\n• سازماندهی سلسله‌مراتبی\n• مسیریابی ایمیل بر اساس دسته\n• بهینه‌سازی SEO برای هر دسته"
        }
      ]
    },
    {
      title: "مدیریت مشتری و CRM",
      content: "مدیریت روابط مشتری پیشرفته با داده‌های یکپارچه مشتری و تجزیه و تحلیل.",
      subsections: [
        {
          title: "سیستم یکپارچه مشتری",
          content: "سیستم CRM واحد برای تمام داده‌های مشتری:\n• مهاجرت خودکار از سیستم‌های قدیمی\n• بخش‌بندی و تجزیه و تحلیل مشتری\n• ردیابی و ثبت فعالیت\n• تاریخچه خرید و معیارها"
        },
        {
          title: "تجزیه و تحلیل مشتری",
          content: "بینش‌های جامع مشتری:\n• تجزیه و تحلیل رفتار خرید\n• توزیع جغرافیایی\n• ارزش طول عمر مشتری\n• بخش‌بندی بر اساس فعالیت و هزینه\n• تولید گزارش PDF"
        },
        {
          title: "مدیریت کیف پول دیجیتال",
          content: "مدیریت موجودی مشتری و پرداخت:\n• ردیابی موجودی کیف پول\n• تأیید درخواست‌های شارژ\n• تاریخچه تراکنش‌ها\n• یکپارچگی روش پرداخت"
        }
      ]
    },
    {
      title: "سیستم مدیریت سفارشات",
      content: "سیستم گردش کار سه بخشی برای پردازش و انجام سفارشات.",
      subsections: [
        {
          title: "گردش کار بخش‌ها",
          content: "پردازش متوالی سفارش از طریق بخش‌ها:\n• بخش مالی: تأیید پرداخت\n• انبار: آماده‌سازی و بسته‌بندی سفارش\n• لجستیک: هماهنگی حمل و نقل و تحویل\n• پیشرفت خودکار بین بخش‌ها"
        },
        {
          title: "ردیابی سفارش",
          content: "مدیریت وضعیت سفارش در زمان واقعی:\n• به‌روزرسانی وضعیت و اعلان‌ها\n• یکپارچگی SMS برای به‌روزرسانی مشتری\n• ردیابی GPS برای تحویل\n• سیستم تأیید تحویل"
        },
        {
          title: "کنترل تازه‌سازی سراسری",
          content: "مدیریت تازه‌سازی متمرکز:\n• کنترل زمان‌بندی یکپارچه در بخش‌ها\n• حالت‌های تازه‌سازی همگام/فردی\n• بازه‌های تازه‌سازی قابل تنظیم\n• همگام‌سازی سراسری سیستم"
        }
      ]
    },
    {
      title: "سیستم خودکارسازی ایمیل",
      content: "مدیریت ایمیل چند SMTP پیشرفته با مسیریابی هوشمند و سیستم قالب.",
      subsections: [
        {
          title: "پیکربندی چند SMTP",
          content: "مسیریابی ایمیل بر اساس دسته:\n• 8 دسته ایمیل با SMTP اختصاصی\n• مسیریابی بخش هوشمند\n• پیکربندی‌های پشتیبان\n• نظارت بر عملکرد"
        },
        {
          title: "مدیریت قالب",
          content: "سیستم قالب ایمیل پیشرفته:\n• جایگزینی متغیر\n• گزینه‌های شخصی‌سازی\n• قالب‌های چندزبانه\n• قابلیت‌های تست A/B"
        },
        {
          title: "تجزیه و تحلیل ایمیل",
          content: "ردیابی جامع عملکرد ایمیل:\n• نرخ تحویل و آمار\n• ردیابی باز کردن و کلیک\n• تجزیه و تحلیل عملکرد مسیریابی\n• نظارت بر خطا و حل آن"
        }
      ]
    },
    {
      title: "SEO و بین‌المللی‌سازی",
      content: "مدیریت جامع SEO برای محتوای چندزبانه و بازارهای بین‌المللی.",
      subsections: [
        {
          title: "SEO چندزبانه",
          content: "بهینه‌سازی SEO برای 4 زبان:\n• تگ‌های meta و توضیحات\n• بهینه‌سازی کلمات کلیدی و محتوا\n• پیاده‌سازی hreflang\n• نقشه‌های سایت خاص زبان"
        },
        {
          title: "تولید نقشه سایت پویا",
          content: "مدیریت نقشه سایت خودکار:\n• 47+ ورودی نقشه سایت\n• ساختار URL چندزبانه\n• به‌روزرسانی‌های خودکار\n• ارسال موتور جستجو"
        },
        {
          title: "مدیریت Robots.txt",
          content: "مدیریت دستورالعمل خزیدن:\n• robots.txt قابل تنظیم\n• بهینه‌سازی موتور جستجو\n• مدیریت بودجه خزیدن\n• ملاحظات امنیتی"
        }
      ]
    },
    {
      title: "یکپارچگی هوش مصنوعی و خودکارسازی",
      content: "ویژگی‌های هوش مصنوعی برای بهبود بهره‌وری و توصیه‌های هوشمند.",
      subsections: [
        {
          title: "تولید SKU مبتنی بر هوش مصنوعی",
          content: "ایجاد SKU محصول هوشمند:\n• الگوهای SKU بر اساس دسته\n• اعتبارسنجی یکتایی خودکار\n• تولید SKU انبوه\n• نظارت بر عملکرد"
        },
        {
          title: "توصیه‌های محصول",
          content: "سیستم هوشمند پیشنهاد محصول:\n• توصیه‌های مبتنی بر صنعت\n• تجزیه و تحلیل رفتار مشتری\n• فرصت‌های فروش متقابل\n• تجزیه و تحلیل عملکرد"
        },
        {
          title: "مدیریت سیستم هوش مصنوعی",
          content: "عملکرد و پیکربندی هوش مصنوعی:\n• یکپارچگی OpenAI API\n• نظارت بر استفاده از توکن\n• بهینه‌سازی عملکرد\n• نظارت بر سلامت سیستم"
        }
      ]
    },
    {
      title: "مدیریت سیستم",
      content: "عملکردهای اصلی مدیریت سیستم، امنیت و نگهداری.",
      subsections: [
        {
          title: "مدیریت کاربر",
          content: "سیستم مدیر چندنقشه:\n• کنترل دسترسی بر اساس بخش\n• تأیید سوپر مدیر\n• تخصیص نقش کاربر\n• ثبت فعالیت"
        },
        {
          title: "مدیریت پایگاه داده",
          content: "نگهداری و پشتیبان‌گیری پایگاه داده:\n• سیستم‌های پشتیبان‌گیری خودکار\n• مدیریت مهاجرت\n• بهینه‌سازی عملکرد\n• بررسی یکپارچگی داده"
        },
        {
          title: "تنظیمات امنیتی",
          content: "مدیریت امنیت پلتفرم:\n• تنظیمات احراز هویت\n• مدیریت جلسه\n• فهرست کنترل دسترسی\n• نظارت بر امنیت"
        },
        {
          title: "نظارت بر عملکرد",
          content: "ردیابی عملکرد سیستم:\n• معیارهای عملکرد سرور\n• بهینه‌سازی query پایگاه داده\n• مدیریت cache\n• نظارت بر خطا"
        }
      ]
    }
  ]
};

// Technical Documentation Data
const technicalDocumentationEN: DocumentationData = {
  title: "Momtazchem Platform - Technical Documentation",
  sections: [
    {
      title: "System Architecture",
      content: "Comprehensive overview of the platform's technical architecture and components.",
      subsections: [
        {
          title: "Frontend Architecture",
          content: "• Framework: React 18 with TypeScript\n• UI Library: Shadcn/ui components with Tailwind CSS\n• State Management: TanStack Query for server state\n• Routing: Wouter for client-side routing\n• Form Handling: React Hook Form with Zod validation\n• Build System: Vite with hot module replacement"
        },
        {
          title: "Backend Architecture",
          content: "• Runtime: Node.js 20 with Express.js\n• Language: TypeScript with ESM modules\n• Session Management: Express sessions with PostgreSQL store\n• File Handling: Multer for uploads\n• Email Service: Nodemailer with multi-SMTP support\n• Authentication: Custom session-based authentication"
        },
        {
          title: "Database Architecture",
          content: "• Database: PostgreSQL 16 (Neon Database Cloud)\n• ORM: Drizzle ORM with type-safe queries\n• Migration: Drizzle Kit for schema management\n• Connection: Serverless with connection pooling\n• Backup: Automated backup with compression"
        }
      ]
    },
    {
      title: "Schema Structure",
      content: "Detailed overview of the database schema organization and relationships.",
      subsections: [
        {
          title: "Core Schema Files",
          content: "• Main Schema (schema.ts): CRM, admin, SEO, content management\n• Showcase Schema: Public products and company info\n• Shop Schema: E-commerce, inventory, EAN-13 barcodes\n• Customer Schema: Customer portal, orders, addresses\n• Email Schema: Multi-SMTP automation and templates\n• CRM Schema: Customer relationship management"
        },
        {
          title: "Key Data Models",
          content: "• Products: Both showcase and shop variants\n• Customers: Unified CRM with portal integration\n• Orders: Three-department workflow system\n• Content: 430+ multilingual content items\n• Email: Multi-category SMTP configuration\n• Inventory: Real-time stock tracking"
        }
      ]
    },
    {
      title: "API Documentation",
      content: "RESTful API endpoints and authentication requirements.",
      subsections: [
        {
          title: "Authentication Endpoints",
          content: "• POST /api/auth/login - Admin/customer login\n• POST /api/auth/logout - Session termination\n• GET /api/auth/me - Current user information\n• POST /api/auth/register - Customer registration\n• POST /api/auth/forgot-password - Password reset"
        },
        {
          title: "Product Management APIs",
          content: "• GET /api/products - List all products\n• POST /api/products - Create new product\n• PUT /api/products/:id - Update product\n• DELETE /api/products/:id - Delete product\n• GET /api/products/barcode/:barcode - Find by barcode\n• POST /api/barcode/generate - Generate barcode"
        },
        {
          title: "Order Management APIs",
          content: "• GET /api/orders - List orders by department\n• POST /api/orders - Create new order\n• PUT /api/orders/:id - Update order status\n• GET /api/orders/:id - Get order details\n• POST /api/orders/:id/approve - Approve order\n• GET /api/orders/delivered - Delivered orders"
        },
        {
          title: "Content Management APIs",
          content: "• GET /api/content - Public content access\n• GET /api/admin/content - Admin content management\n• POST /api/admin/content - Create content item\n• PUT /api/admin/content/:id - Update content\n• DELETE /api/admin/content/:id - Delete content"
        }
      ]
    },
    {
      title: "Configuration & Environment",
      content: "Environment variables, configuration settings, and deployment requirements.",
      subsections: [
        {
          title: "Environment Variables",
          content: "• DATABASE_URL: PostgreSQL connection string\n• SESSION_SECRET: Session encryption key\n• EMAIL_HOST/USER/PASS: SMTP configuration\n• OPENAI_API_KEY: AI services integration\n• NODE_ENV: Environment mode (development/production)"
        },
        {
          title: "Configuration Files",
          content: "• drizzle.config.ts: Database migration configuration\n• vite.config.ts: Frontend build configuration\n• tailwind.config.ts: UI styling configuration\n• tsconfig.json: TypeScript compiler settings\n• package.json: Dependencies and scripts"
        },
        {
          title: "Deployment Settings",
          content: "• Platform: Replit with Node.js 20\n• Port: 5000 internal, 80 external\n• Build: npm run build (Vite + esbuild)\n• Start: npm run dev (development), npm run start (production)\n• Database: Neon Database cloud instance"
        }
      ]
    },
    {
      title: "Security & Performance",
      content: "Security measures, performance optimizations, and monitoring systems.",
      subsections: [
        {
          title: "Security Implementation",
          content: "• Authentication: Session-based with secure cookies\n• Authorization: Role-based access control\n• Data Validation: Zod schema validation\n• SQL Injection: Parameterized queries with Drizzle\n• XSS Protection: Content Security Policy\n• CSRF Protection: Express session security"
        },
        {
          title: "Performance Optimization",
          content: "• Database: Connection pooling and query optimization\n• Frontend: Code splitting and lazy loading\n• Caching: TanStack Query with stale-while-revalidate\n• Images: Optimized compression and delivery\n• Assets: Vite bundling with tree shaking\n• CDN: Static asset optimization"
        },
        {
          title: "Monitoring & Logging",
          content: "• Error Tracking: Comprehensive error logging\n• Performance Metrics: Response time monitoring\n• Database Monitoring: Query performance tracking\n• Email Monitoring: Delivery rate tracking\n• System Health: Automated health checks\n• Backup Monitoring: Automated backup verification"
        }
      ]
    },
    {
      title: "Integration & External Services",
      content: "Third-party integrations and external service configurations.",
      subsections: [
        {
          title: "Email Services",
          content: "• Primary: Zoho Mail SMTP\n• Multi-SMTP: Category-based routing\n• Templates: Dynamic template system\n• Analytics: Delivery and engagement tracking\n• Fallback: Automatic failover configuration"
        },
        {
          title: "Payment Integration",
          content: "• Iraqi Banking: Rasheed, Al-Rafidain, Trade Bank\n• Payment Processing: Manual verification workflow\n• Invoice Generation: PDF generation with Puppeteer\n• Currency Support: USD, EUR, IQD\n• Wallet System: Digital balance management"
        },
        {
          title: "AI Services",
          content: "• OpenAI API: GPT-4 integration\n• SKU Generation: Smart product code creation\n• Recommendations: Customer behavior analysis\n• Performance Monitoring: Token usage tracking\n• Fallback: Intelligent fallback systems"
        },
        {
          title: "Analytics & Reporting",
          content: "• Geographic Analytics: Iraq and Turkey data\n• Customer Analytics: Behavior and segmentation\n• Sales Reporting: Performance metrics\n• PDF Reports: Automated report generation\n• Real-time Monitoring: Live dashboard updates"
        }
      ]
    }
  ]
};

const technicalDocumentationFA: DocumentationData = {
  title: "مستندات فنی پلتفرم ممتازکم",
  sections: [
    {
      title: "معماری سیستم",
      content: "نمای کلی جامع از معماری فنی و اجزای پلتفرم.",
      subsections: [
        {
          title: "معماری Frontend",
          content: "• Framework: React 18 با TypeScript\n• UI Library: کامپوننت‌های Shadcn/ui با Tailwind CSS\n• State Management: TanStack Query برای server state\n• Routing: Wouter برای client-side routing\n• Form Handling: React Hook Form با اعتبارسنجی Zod\n• Build System: Vite با hot module replacement"
        },
        {
          title: "معماری Backend",
          content: "• Runtime: Node.js 20 با Express.js\n• Language: TypeScript با ماژول‌های ESM\n• Session Management: Express sessions با PostgreSQL store\n• File Handling: Multer برای uploads\n• Email Service: Nodemailer با پشتیبانی multi-SMTP\n• Authentication: احراز هویت مبتنی بر session سفارشی"
        },
        {
          title: "معماری پایگاه داده",
          content: "• Database: PostgreSQL 16 (Neon Database Cloud)\n• ORM: Drizzle ORM با کوئری‌های type-safe\n• Migration: Drizzle Kit برای مدیریت schema\n• Connection: Serverless با connection pooling\n• Backup: پشتیبان‌گیری خودکار با فشرده‌سازی"
        }
      ]
    },
    {
      title: "ساختار Schema",
      content: "نمای کلی تفصیلی از سازماندهی schema پایگاه داده و روابط.",
      subsections: [
        {
          title: "فایل‌های Schema اصلی",
          content: "• Main Schema (schema.ts): CRM، admin، SEO، مدیریت محتوا\n• Showcase Schema: محصولات عمومی و اطلاعات شرکت\n• Shop Schema: تجارت الکترونیک، موجودی، بارکدهای EAN-13\n• Customer Schema: پورتال مشتری، سفارشات، آدرس‌ها\n• Email Schema: خودکارسازی multi-SMTP و قالب‌ها\n• CRM Schema: مدیریت روابط مشتری"
        },
        {
          title: "مدل‌های کلیدی داده",
          content: "• Products: انواع نمایشگاهی و فروشگاهی\n• Customers: CRM یکپارچه با یکپارچگی پورتال\n• Orders: سیستم گردش کار سه بخشی\n• Content: 430+ آیتم محتوای چندزبانه\n• Email: پیکربندی SMTP چندکاتگوری\n• Inventory: ردیابی موجودی در زمان واقعی"
        }
      ]
    },
    {
      title: "مستندات API",
      content: "نقاط پایانی RESTful API و الزامات احراز هویت.",
      subsections: [
        {
          title: "نقاط پایانی احراز هویت",
          content: "• POST /api/auth/login - ورود مدیر/مشتری\n• POST /api/auth/logout - پایان جلسه\n• GET /api/auth/me - اطلاعات کاربر فعلی\n• POST /api/auth/register - ثبت‌نام مشتری\n• POST /api/auth/forgot-password - بازیابی رمز عبور"
        },
        {
          title: "APIهای مدیریت محصول",
          content: "• GET /api/products - لیست تمام محصولات\n• POST /api/products - ایجاد محصول جدید\n• PUT /api/products/:id - به‌روزرسانی محصول\n• DELETE /api/products/:id - حذف محصول\n• GET /api/products/barcode/:barcode - یافتن بر اساس بارکد\n• POST /api/barcode/generate - تولید بارکد"
        },
        {
          title: "APIهای مدیریت سفارش",
          content: "• GET /api/orders - لیست سفارشات بر اساس بخش\n• POST /api/orders - ایجاد سفارش جدید\n• PUT /api/orders/:id - به‌روزرسانی وضعیت سفارش\n• GET /api/orders/:id - دریافت جزئیات سفارش\n• POST /api/orders/:id/approve - تأیید سفارش\n• GET /api/orders/delivered - سفارشات تحویل شده"
        },
        {
          title: "APIهای مدیریت محتوا",
          content: "• GET /api/content - دسترسی محتوای عمومی\n• GET /api/admin/content - مدیریت محتوای مدیر\n• POST /api/admin/content - ایجاد آیتم محتوا\n• PUT /api/admin/content/:id - به‌روزرسانی محتوا\n• DELETE /api/admin/content/:id - حذف محتوا"
        }
      ]
    },
    {
      title: "پیکربندی و محیط",
      content: "متغیرهای محیطی، تنظیمات پیکربندی، و الزامات استقرار.",
      subsections: [
        {
          title: "متغیرهای محیطی",
          content: "• DATABASE_URL: رشته اتصال PostgreSQL\n• SESSION_SECRET: کلید رمزگذاری جلسه\n• EMAIL_HOST/USER/PASS: پیکربندی SMTP\n• OPENAI_API_KEY: یکپارچگی خدمات AI\n• NODE_ENV: حالت محیط (development/production)"
        },
        {
          title: "فایل‌های پیکربندی",
          content: "• drizzle.config.ts: پیکربندی migration پایگاه داده\n• vite.config.ts: پیکربندی build frontend\n• tailwind.config.ts: پیکربندی styling UI\n• tsconfig.json: تنظیمات compiler TypeScript\n• package.json: وابستگی‌ها و scripts"
        },
        {
          title: "تنظیمات استقرار",
          content: "• Platform: Replit با Node.js 20\n• Port: 5000 داخلی، 80 خارجی\n• Build: npm run build (Vite + esbuild)\n• Start: npm run dev (development), npm run start (production)\n• Database: نمونه cloud Neon Database"
        }
      ]
    },
    {
      title: "امنیت و عملکرد",
      content: "اقدامات امنیتی، بهینه‌سازی عملکرد، و سیستم‌های نظارت.",
      subsections: [
        {
          title: "پیاده‌سازی امنیت",
          content: "• Authentication: مبتنی بر session با کوکی‌های امن\n• Authorization: کنترل دسترسی مبتنی بر نقش\n• Data Validation: اعتبارسنجی schema Zod\n• SQL Injection: کوئری‌های پارامتری با Drizzle\n• XSS Protection: سیاست امنیت محتوا\n• CSRF Protection: امنیت session Express"
        },
        {
          title: "بهینه‌سازی عملکرد",
          content: "• Database: connection pooling و بهینه‌سازی کوئری\n• Frontend: تقسیم کد و بارگیری lazy\n• Caching: TanStack Query با stale-while-revalidate\n• Images: فشرده‌سازی و تحویل بهینه\n• Assets: بسته‌بندی Vite با tree shaking\n• CDN: بهینه‌سازی دارایی‌های استاتیک"
        },
        {
          title: "نظارت و گزارش‌گیری",
          content: "• Error Tracking: گزارش‌گیری خطای جامع\n• Performance Metrics: نظارت بر زمان پاسخ\n• Database Monitoring: ردیابی عملکرد کوئری\n• Email Monitoring: ردیابی نرخ تحویل\n• System Health: بررسی سلامت خودکار\n• Backup Monitoring: تأیید پشتیبان‌گیری خودکار"
        }
      ]
    },
    {
      title: "یکپارچگی و خدمات خارجی",
      content: "یکپارچگی‌های شخص ثالث و پیکربندی‌های خدمات خارجی.",
      subsections: [
        {
          title: "خدمات ایمیل",
          content: "• Primary: Zoho Mail SMTP\n• Multi-SMTP: مسیریابی مبتنی بر دسته\n• Templates: سیستم قالب پویا\n• Analytics: ردیابی تحویل و تعامل\n• Fallback: پیکربندی failover خودکار"
        },
        {
          title: "یکپارچگی پرداخت",
          content: "• Iraqi Banking: رشید، الرافدین، بانک تجاری\n• Payment Processing: گردش کار تأیید دستی\n• Invoice Generation: تولید PDF با Puppeteer\n• Currency Support: USD، EUR، IQD\n• Wallet System: مدیریت موجودی دیجیتال"
        },
        {
          title: "خدمات AI",
          content: "• OpenAI API: یکپارچگی GPT-4\n• SKU Generation: ایجاد کد محصول هوشمند\n• Recommendations: تجزیه و تحلیل رفتار مشتری\n• Performance Monitoring: ردیابی استفاده از توکن\n• Fallback: سیستم‌های پشتیبان هوشمند"
        },
        {
          title: "تجزیه و تحلیل و گزارش‌گیری",
          content: "• Geographic Analytics: داده‌های عراق و ترکیه\n• Customer Analytics: رفتار و بخش‌بندی\n• Sales Reporting: معیارهای عملکرد\n• PDF Reports: تولید گزارش خودکار\n• Real-time Monitoring: به‌روزرسانی‌های داشبورد زنده"
        }
      ]
    }
  ]
};

// HTML template for PDF generation
function generateDocumentationHTML(data: DocumentationData, language: 'en' | 'fa'): string {
  const isRTL = language === 'fa';
  const fontFamily = isRTL ? 'Noto Sans Arabic, Arial, sans-serif' : 'Arial, sans-serif';
  
  return `
    <!DOCTYPE html>
    <html lang="${language}" dir="${isRTL ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: ${fontFamily};
          line-height: 1.6;
          color: #333;
          background: #fff;
          font-size: 14px;
          direction: ${isRTL ? 'rtl' : 'ltr'};
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px 0;
          border-bottom: 3px solid #0066cc;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #0066cc;
          margin-bottom: 10px;
        }
        
        .header .subtitle {
          font-size: 16px;
          color: #666;
          font-weight: 300;
        }
        
        .section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 22px;
          font-weight: 600;
          color: #0066cc;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .section-content {
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 25px;
          color: #444;
        }
        
        .subsection {
          margin-bottom: 30px;
          margin-${isRTL ? 'right' : 'left'}: 20px;
        }
        
        .subsection-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
          padding-${isRTL ? 'right' : 'left'}: 15px;
          border-${isRTL ? 'right' : 'left'}: 4px solid #0066cc;
        }
        
        .subsection-content {
          font-size: 14px;
          line-height: 1.7;
          color: #555;
          white-space: pre-line;
        }
        
        .footer {
          text-align: center;
          margin-top: 60px;
          padding-top: 30px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 12px;
        }
        
        /* Print styles */
        @media print {
          body {
            font-size: 12px;
          }
          
          .container {
            max-width: 100%;
            margin: 0;
            padding: 15px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          .section-title {
            font-size: 18px;
          }
          
          .subsection-title {
            font-size: 16px;
          }
          
          .section {
            page-break-inside: avoid;
          }
          
          .subsection {
            page-break-inside: avoid;
          }
        }
        
        /* List styling */
        ul {
          margin: 10px 0;
          padding-${isRTL ? 'right' : 'left'}: 25px;
        }
        
        li {
          margin-bottom: 5px;
          line-height: 1.6;
        }
        
        /* Code and technical text */
        code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          .section-title {
            font-size: 18px;
          }
          
          .subsection-title {
            font-size: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.title}</h1>
          <div class="subtitle">
            ${isRTL ? 'تاریخ تولید: ' + new Date().toLocaleDateString('fa-IR') : 'Generated on: ' + new Date().toLocaleDateString('en-US')}
          </div>
        </div>
        
        ${data.sections.map(section => `
          <div class="section">
            <h2 class="section-title">${section.title}</h2>
            <div class="section-content">${section.content}</div>
            
            ${section.subsections ? section.subsections.map(subsection => `
              <div class="subsection">
                <h3 class="subsection-title">${subsection.title}</h3>
                <div class="subsection-content">${subsection.content}</div>
              </div>
            `).join('') : ''}
          </div>
        `).join('')}
        
        <div class="footer">
          <p>
            ${isRTL ? 
              'این مستند توسط پلتفرم ممتازکم تولید شده است - برای اطلاعات بیشتر با info@momtazchem.com تماس بگیرید' : 
              'This document was generated by Momtazchem Platform - For more information contact info@momtazchem.com'
            }
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// PDF Generation Functions
export async function generateUserDocumentationPDF(language: 'en' | 'fa' = 'en'): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const data = language === 'fa' ? userDocumentationFA : userDocumentationEN;
    const html = generateDocumentationHTML(data, language);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });
    
    return pdf;
  } finally {
    await browser.close();
  }
}

export async function generateAdminDocumentationPDF(language: 'en' | 'fa' = 'en'): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const data = language === 'fa' ? adminDocumentationFA : adminDocumentationEN;
    const html = generateDocumentationHTML(data, language);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });
    
    return pdf;
  } finally {
    await browser.close();
  }
}

export async function generateTechnicalDocumentationPDF(language: 'en' | 'fa' = 'en'): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const data = language === 'fa' ? technicalDocumentationFA : technicalDocumentationEN;
    const html = generateDocumentationHTML(data, language);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });
    
    return pdf;
  } finally {
    await browser.close();
  }
}

// Combined documentation generator
export async function generateComprehensiveDocumentationPDF(language: 'en' | 'fa' = 'en'): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Combine all documentation
    const userData = language === 'fa' ? userDocumentationFA : userDocumentationEN;
    const adminData = language === 'fa' ? adminDocumentationFA : adminDocumentationEN;
    const techData = language === 'fa' ? technicalDocumentationFA : technicalDocumentationEN;
    
    const combinedData: DocumentationData = {
      title: language === 'fa' ? 'مستندات کامل پلتفرم ممتازکم' : 'Momtazchem Platform - Complete Documentation',
      sections: [
        ...userData.sections,
        ...adminData.sections,
        ...techData.sections
      ]
    };
    
    const html = generateDocumentationHTML(combinedData, language);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });
    
    return pdf;
  } finally {
    await browser.close();
  }
}