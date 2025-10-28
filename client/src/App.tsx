import React, { lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ShopSearch from "./components/ShopSearch";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import About from "@/pages/about";
import Services from "@/pages/services";
import Contact from "@/pages/contact";
import Shop from "@/pages/shop";
import Checkout from "@/pages/checkout";
import Payment from "@/pages/payment";
import CheckoutSuccess from "@/pages/checkout-success";
import PaymentOptionsPage from "@/pages/payment-options";
import ShopAdmin from "@/pages/shop-admin";
import InvoiceManagement from "@/pages/admin/invoice-management";
import PaymentSettings from "@/pages/admin/payment-settings";
import PaymentTestPage from "@/pages/PaymentTestPage";
import AdminPage from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import AdminUsers from "@/pages/admin-users";

import BarcodeInventory from "@/pages/admin/barcode-inventory";
import DatabaseManagement from "@/pages/admin/database-management";
import UserManagementRedesign from "@/pages/admin/user-management-redesign";
import FactoryManagement from "@/pages/admin/factory-management";
import ProceduresManagement from "@/pages/admin/procedures-management";

import EmailSettingsPage from "@/pages/admin/email-settings";
import AdvancedEmailSettingsPage from "@/pages/admin/advanced-email-settings";
import EmailAddressManagerFixed from "@/pages/admin/email-address-manager-fixed";
import EmailProgressPage from "@/pages/admin/email-progress";
import EmailTemplates from '@/pages/admin/email-templates';
import EmailTemplatesFixed from '@/pages/admin/email-templates-fixed';
import EmailTemplatesCentral from '@/pages/admin/email-templates-central';
import Template05View from '@/pages/admin/template05-view';
import Template05StaticView from '@/pages/admin/template05-static-view';
import MarketingModule from '@/pages/admin/marketing-module';

import EmailRoutingStats from "@/pages/admin/email-routing-stats";
import AutomatedEmailLogs from "@/pages/admin/automated-email-logs";
import InquiryResponses from '@/pages/admin/inquiry-responses';
import ServerConfig from "@/components/admin/server-config";
import AwsS3Settings from "@/pages/admin/aws-s3-settings";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import PasswordReset from "@/pages/password-reset";
import CustomerForgotPassword from "@/pages/customer-forgot-password";
import CustomerResetPassword from "@/pages/customer-reset-password";
import CRMPage from "@/pages/crm";
import CustomerProfile from "@/pages/customer-profile";
import CustomerProfileEdit from "@/pages/customer-profile-edit";
import CustomerRegister from "@/pages/customer-register";
import CustomerLogin from "@/pages/customer-login";
import CustomerWallet from "@/pages/customer-wallet";
import WalletManagement from "@/pages/admin/wallet-management";
import ProductVariants from "@/pages/admin/product-variants";
import SalesAnalytics from "@/pages/sales-analytics";
import FinancialWorkflowDashboard from "@/pages/admin/financial-workflow-dashboard";
import Products from "@/pages/products";
import ProductsPage from "@/pages/products";
import BatchManagement from "@/pages/batch-management";

import ProductReviews from "@/pages/product-reviews";
import TestProductImageUpload from "@/pages/test-product-image-upload";
import FuelAdditives from "@/pages/products/fuel-additives";
import WaterTreatment from "@/pages/products/water-treatment";
import PaintThinner from "@/pages/products/paint-thinner";
import AgriculturalFertilizers from "@/pages/products/agricultural-fertilizers";
import OtherProducts from "@/pages/products/other";
import TechnicalEquipment from "@/pages/products/technical-equipment";
import CommercialGoods from "@/pages/products/commercial-goods";
import WebRTC from "@/pages/webrtc";
import JitsiMeetPage from "@/pages/jitsi";
import QuotePage from "@/pages/quote";
import Dashboard from "@/pages/dashboard";
import InquiryDetail from "@/pages/inquiry-detail";
import CategoryManagement from "@/pages/category-management";
import SeoManagement from "@/pages/seo-management";
import AdminSmsManagement from "@/pages/admin-sms-management";
import WidgetRecommendations from "@/pages/widget-recommendations";
// Removed AdminOrderManagement - replaced with OrderTrackingManagement for order-management module
import AbandonedCartManagement from "@/pages/abandoned-cart-management";
import FinancialDepartment from "@/pages/financial-department";
import WarehouseDepartment from "@/pages/warehouse-department";
import LogisticsDepartment from "@/pages/logistics-department";
import FinanceOrders from "@/pages/admin/finance-orders";
import LogisticsSimple from "@/pages/logistics-simple";
import FinancialLogin from "@/pages/financial-login";
import WarehouseLogin from "@/pages/warehouse-login";
import LogisticsLogin from "@/pages/logistics-login";
import TicketingSystemFixed from "@/pages/admin/ticketing-system-fixed";

import SuperAdminSettings from "@/pages/super-admin-settings";
import SuperAdminOrderManagement from "@/pages/admin/super-admin-order-management";
import SiteManagementFixed from "@/pages/site-management-fixed";
import GeographicReports from "@/pages/geographic-reports";
import GeographicAnalytics from "@/pages/admin/geographic-analytics";
import IraqiGeography from "@/pages/admin/iraqi-geography";
import AISettings from "@/pages/admin/ai-settings";
import DocumentationPage from "@/pages/documentation";
import WarehouseOrders from "@/pages/admin/warehouse-orders";
import LogisticsOrders from "@/pages/admin/logistics-orders";
import LogisticsManagement from "@/pages/admin/logistics-management";
import DeliveredOrders from "@/pages/admin/delivered-orders";
import PaymentOptions from "@/pages/payment-options";
import GlobalRefreshSettings from "@/pages/admin/global-refresh-settings";

import InventoryNotificationSettings from "@/pages/admin/inventory-notification-settings";
import WarehouseManagement from "@/pages/admin/warehouse-management";
import WarehouseManagementFixed from "@/pages/admin/warehouse-management-fixed";
import ContentManagement from "@/pages/content-management";

import SecurityManagement from "@/pages/security-management-new";
import OrderTrackingManagement from "@/pages/admin/order-tracking-management";
import RemoteDesktop from "@/pages/admin/remote-desktop";

import TemplateDistribution from "@/pages/admin/template-distribution";
import TemplateNumberingSystem from "@/pages/admin/template-numbering-system";
import WhatsAppCRM from "@/pages/admin/whatsapp-crm";
import WhatsAppCRMEnglish from "@/pages/admin/whatsapp-crm-en";

import BankReceiptUpload from "@/pages/bank-receipt-upload";
import WalletCorrection from "@/pages/admin/wallet-correction";
import WalletDebugTest from "@/pages/wallet-debug-test";
import TestLogistics from "@/pages/test-logistics";
import KpiDashboard from "@/pages/kpi-dashboard";
import KpiReport from "@/pages/kpi-report";
import ManagementDashboard from "@/pages/management-dashboard";
import AccountingManagement from "@/pages/admin/accounting-management";
import CompanyInformation from "@/pages/admin/company-information";
import VehicleOptimization from "@/pages/admin/vehicle-optimization";
import LogisticsGeography from "@/pages/admin/logistics-geography";
import UserGuide from "@/pages/user-guide";
import HybridPayment from "@/pages/hybrid-payment";
import PaymentCallback from "@/pages/payment-callback";
import OrderSuccess from "@/pages/order-success";
import AdminAbandonedOrders from "@/pages/admin-abandoned-orders";
import FooterManagement from "@/pages/admin/footer-management";
import ShopManagement from "@/pages/admin/shop-management";
import VehicleHistoryPage from "@/pages/admin/vehicle-history";

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/services" component={Services} />
          <Route path="/contact" component={Contact} />
          <Route path="/user-guide" component={UserGuide} />
          <Route path="/help" component={UserGuide} />
          <Route path="/shop" component={Shop} />
          <Route path="/payment-options" component={PaymentOptionsPage} />
          <Route path="/checkout" component={() => <Checkout cart={[]} products={[]} onOrderComplete={() => {}} />} />
          <Route path="/payment/:orderId" component={Payment} />
          <Route path="/payment/:orderNumber" component={HybridPayment} />
          <Route path="/payment-callback" component={PaymentCallback} />
          <Route path="/payment-cancelled" component={PaymentCallback} />
          <Route path="/payment-failed/:orderNumber" component={PaymentCallback} />
          <Route path="/payment-pending/:orderNumber" component={PaymentCallback} />
          <Route path="/checkout/success/:orderId" component={CheckoutSuccess} />
          <Route path="/order-success/:orderNumber" component={OrderSuccess} />
          <Route path="/bank-receipt-upload/:orderId" component={BankReceiptUpload} />
          <Route path="/shop-search" component={ShopSearch} />
          <Route path="/shop-admin" component={ShopAdmin} />
          <Route path="/admin/shop" component={ShopAdmin} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/users" component={AdminUsers} />

          <Route path="/admin/barcode-inventory" component={BarcodeInventory} />
          <Route path="/admin/database-management" component={DatabaseManagement} />
          <Route path="/admin/user-management" component={UserManagementRedesign} />
          <Route path="/user-management" component={UserManagementRedesign} />
          <Route path="/admin/factory-management" component={FactoryManagement} />
          <Route path="/admin/procedures-management" component={ProceduresManagement} />

          <Route path="/admin/email-settings" component={EmailSettingsPage} />
          <Route path="/admin/advanced-email-settings" component={AdvancedEmailSettingsPage} />
          <Route path="/admin/email-address-manager" component={EmailAddressManagerFixed} />
          <Route path="/admin/email-progress" component={EmailProgressPage} />
          <Route path="/admin/email-templates" component={EmailTemplates} />
          <Route path="/admin/email-routing-stats" component={EmailRoutingStats} />

          <Route path="/admin/email-templates-central" component={EmailTemplatesCentral} />
          <Route path="/admin/automated-email-logs" component={AutomatedEmailLogs} />
          <Route path="/admin/email-templates-fixed" component={EmailTemplatesFixed} />
          <Route path="/admin/template-distribution" component={TemplateDistribution} />
          <Route path="/admin/template-numbering-system" component={TemplateNumberingSystem} />
          <Route path="/admin/invoice-management" component={InvoiceManagement} />
          <Route path="/admin/payment-settings" component={PaymentSettings} />
          <Route path="/test-payment" component={PaymentTestPage} />
          <Route path="/admin/wallet-management" component={WalletManagement} />
          <Route path="/admin/wallet-correction" component={WalletCorrection} />
          <Route path="/wallet-debug-test" component={WalletDebugTest} />
          <Route path="/admin/inquiries" component={Dashboard} />
          <Route path="/admin/inquiry/:id" component={InquiryDetail} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password/:token" component={ResetPassword} />
          <Route path="/password-reset" component={PasswordReset} />
          <Route path="/customer/forgot-password" component={CustomerForgotPassword} />
          <Route path="/customer/reset-password" component={CustomerResetPassword} />
          <Route path="/customer-reset-password" component={CustomerResetPassword} />
          <Route path="/customer/login" component={CustomerLogin} />
          <Route path="/customer/register" component={CustomerRegister} />
          <Route path="/crm" component={CRMPage} />
          <Route path="/customer/profile" component={CustomerProfile} />
          <Route path="/customer-profile" component={CustomerProfile} />
          <Route path="/customer/profile/edit" component={CustomerProfileEdit} />
          <Route path="/customer/profile-edit" component={CustomerProfileEdit} />
          <Route path="/customer-profile-edit" component={CustomerProfileEdit} />
          <Route path="/customer/wallet" component={CustomerWallet} />
          <Route path="/customer/bank-receipt-upload" component={BankReceiptUpload} />
          <Route path="/customer/bank-receipt-upload/:orderId" component={BankReceiptUpload} />
          <Route path="/category-management" component={CategoryManagement} />
          <Route path="/seo-management" component={SeoManagement} />
          <Route path="/admin/sms-management" component={AdminSmsManagement} />
          <Route path="/admin/whatsapp-crm" component={WhatsAppCRM} />
          <Route path="/admin/whatsapp-crm-en" component={WhatsAppCRMEnglish} />
          <Route path="/admin/email-logs" component={lazy(() => import("@/pages/admin-email-logs"))} />
          <Route path="/admin/sms" component={AdminSmsManagement} />
          <Route path="/admin/widgets" component={WidgetRecommendations} />
          <Route path="/admin/order-management" component={OrderTrackingManagement} />
          <Route path="/admin/order-tracking" component={OrderTrackingManagement} />
          <Route path="/admin/order-tracking-management" component={OrderTrackingManagement} />
          <Route path="/admin/abandoned-cart-management" component={AbandonedCartManagement} />
          <Route path="/site-management" component={SiteManagementFixed} />
          <Route path="/admin/site-management" component={SiteManagementFixed} />
          <Route path="/admin/products" component={ProductsPage} />
          <Route path="/admin/product-variants" component={ProductVariants} />
          <Route path="/admin/geographic-reports" component={GeographicReports} />
          <Route path="/admin/geographic-analytics" component={GeographicAnalytics} />
          <Route path="/admin/iraqi-geography" component={IraqiGeography} />
          <Route path="/admin/ai-settings" component={AISettings} />
          <Route path="/documentation" component={DocumentationPage} />
          
          {/* New Department Order Management Pages */}
          <Route path="/admin/finance-orders" component={FinanceOrders} />
          <Route path="/admin/warehouse-orders" component={WarehouseOrders} />
          <Route path="/admin/logistics-orders" component={LogisticsOrders} />
          <Route path="/admin/logistics-management" component={LogisticsManagement} />
          <Route path="/admin/logistics" component={LogisticsManagement} />
          <Route path="/admin/vehicle-types-management" component={lazy(() => import("@/pages/admin/vehicle-types-management"))} />
          <Route path="/admin/delivered-orders" component={DeliveredOrders} />
          <Route path="/admin/financial-workflow" component={FinancialWorkflowDashboard} />
          <Route path="/payment-options" component={PaymentOptions} />
          <Route path="/admin/global-refresh-settings" component={GlobalRefreshSettings} />

          <Route path="/admin/inventory-notification-settings" component={InventoryNotificationSettings} />
          <Route path="/admin/warehouse-management" component={WarehouseManagementFixed} />

          <Route path="/admin/content-management" component={ContentManagement} />
          <Route path="/content-management" component={ContentManagement} />
          <Route path="/admin/footer-management" component={FooterManagement} />
          <Route path="/admin/shop-management" component={ShopManagement} />
          <Route path="/admin/email-templates" component={EmailTemplatesFixed} />
          <Route path="/admin/email-templates-fixed" component={EmailTemplatesFixed} />
          <Route path="/admin/email-templates-central" component={EmailTemplatesCentral} />
          <Route path="/admin/template05-view" component={Template05View} />
          <Route path="/admin/template05-static" component={Template05StaticView} />
          <Route path="/admin/inquiry-responses" component={InquiryResponses} />
          <Route path="/admin/marketing-module" component={MarketingModule} />

          <Route path="/admin/security-management" component={SecurityManagement} />
          <Route path="/admin/ticketing-system" component={TicketingSystemFixed} />
          <Route path="/admin/abandoned-orders" component={AdminAbandonedOrders} />
          <Route path="/admin/remote-desktop" component={RemoteDesktop} />
          <Route path="/admin/server-config" component={ServerConfig} />
          <Route path="/admin/aws-s3-settings" component={AwsS3Settings} />
          <Route path="/admin/batch-management" component={BatchManagement} />
          <Route path="/admin/kpi-dashboard" component={KpiDashboard} />
          <Route path="/admin/kpi-report" component={KpiReport} />
          <Route path="/admin/management-dashboard" component={ManagementDashboard} />
          <Route path="/admin/accounting-management" component={AccountingManagement} />
          <Route path="/admin/company-information" component={CompanyInformation} />
          <Route path="/admin/vehicle-optimization" component={VehicleOptimization} />
          <Route path="/admin/vehicle-history" component={VehicleHistoryPage} />
          <Route path="/admin/logistics-geography" component={LogisticsGeography} />
          <Route path="/admin/pdf-test" component={lazy(() => import("@/pages/admin/pdf-test"))} />


          
          {/* Department-specific routes */}
          <Route path="/financial" component={FinancialDepartment} />
          <Route path="/financial/login" component={FinancialLogin} />
          <Route path="/warehouse" component={WarehouseManagementFixed} />
          <Route path="/warehouse/login" component={WarehouseLogin} />
          <Route path="/logistics-department" component={LogisticsDepartment} />
          <Route path="/logistics-full" component={LogisticsDepartment} />
          <Route path="/logistics" component={LogisticsSimple} />
          <Route path="/logistics/login" component={LogisticsLogin} />
          <Route path="/test-logistics" component={TestLogistics} />

          <Route path="/super-admin/settings" component={SuperAdminSettings} />
          <Route path="/admin/super-admin-settings" component={SuperAdminSettings} />
          <Route path="/admin/super-admin-order-management" component={SuperAdminOrderManagement} />
          <Route path="/super-admin/order-management" component={SuperAdminOrderManagement} />
          
          <Route path="/analytics/sales" component={SalesAnalytics} />
          <Route path="/products" component={Products} />
          <Route path="/test-product-image-upload" component={TestProductImageUpload} />
          <Route path="/products/fuel-additives" component={FuelAdditives} />
          <Route path="/products/water-treatment" component={WaterTreatment} />
          <Route path="/products/paint-thinner" component={PaintThinner} />
          <Route path="/products/paint-solvents" component={PaintThinner} />
          <Route path="/products/agricultural-fertilizers" component={AgriculturalFertilizers} />
          <Route path="/products/other" component={OtherProducts} />
          <Route path="/products/industrial-chemicals" component={OtherProducts} />
          <Route path="/products/commercial-goods" component={CommercialGoods} />
          <Route path="/products/technical-equipment" component={TechnicalEquipment} />
          <Route path="/product-reviews/:id" component={ProductReviews} />
          <Route path="/quote" component={QuotePage} />
          <Route path="/documentation" component={DocumentationPage} />
          <Route path="/webrtc" component={WebRTC} />
          <Route path="/jitsi" component={JitsiMeetPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App rendering error:', error);
    return (
      <div style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
        <h1>Loading Error</h1>
        <p>There was an error loading the application. Please check the console for details.</p>
        <pre>{String(error)}</pre>
      </div>
    );
  }
}

export default App;
