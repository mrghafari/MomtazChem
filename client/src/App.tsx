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
import ShopAdmin from "@/pages/shop-admin";
import InvoiceManagement from "@/pages/admin/invoice-management";
import PaymentSettings from "@/pages/admin/payment-settings";
import AdminPage from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import AdminUsers from "@/pages/admin-users";

import BarcodeInventory from "@/pages/admin/barcode-inventory";
import DatabaseManagement from "@/pages/admin/database-management";
import UserManagement from "@/pages/admin/user-management";
import FactoryManagement from "@/pages/admin/factory-management";
import ProceduresManagement from "@/pages/admin/procedures-management";
import SMTPTestPage from "@/pages/admin/smtp-test";
import EmailSettingsPage from "@/pages/admin/email-settings";
import AdvancedEmailSettingsPage from "@/pages/admin/advanced-email-settings";
import EmailProgressPage from "@/pages/admin/email-progress";
import EmailRoutingStats from "@/pages/admin/email-routing-stats";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import CustomerForgotPassword from "@/pages/customer-forgot-password";
import CustomerResetPassword from "@/pages/customer-reset-password";
import CRMPage from "@/pages/crm";
import CustomerProfile from "@/pages/customer-profile";
import CustomerProfileEdit from "@/pages/customer-profile-edit";
import CustomerRegister from "@/pages/customer-register";
import CustomerWallet from "@/pages/customer-wallet";
import WalletManagement from "@/pages/admin/wallet-management";
import ProductVariants from "@/pages/admin/product-variants";
import SalesAnalytics from "@/pages/sales-analytics";
import Products from "@/pages/products";
import ProductsPage from "@/pages/products";
import ProductRecommendations from "@/pages/product-recommendations";
import FuelAdditives from "@/pages/products/fuel-additives";
import WaterTreatment from "@/pages/products/water-treatment";
import PaintThinner from "@/pages/products/paint-thinner";
import AgriculturalFertilizers from "@/pages/products/agricultural-fertilizers";
import OtherProducts from "@/pages/products/other";
import PaintSolvents from "@/pages/paint-solvents";
import IndustrialChemicals from "@/pages/industrial-chemicals";
import CommercialGoods from "@/pages/commercial-goods";
import TechnicalEquipment from "@/pages/technical-equipment";
import QuotePage from "@/pages/quote";
import Dashboard from "@/pages/dashboard";
import InquiryDetail from "@/pages/inquiry-detail";
import CategoryManagement from "@/pages/category-management";
import SeoManagement from "@/pages/seo-management";
import AdminSmsManagement from "@/pages/admin-sms-management";
import WidgetRecommendations from "@/pages/widget-recommendations";
import AdminOrderManagement from "@/pages/admin-order-management";
import FinancialDepartment from "@/pages/financial-department";
import WarehouseDepartment from "@/pages/warehouse-department";
import LogisticsDepartment from "@/pages/logistics-department";
import LogisticsSimple from "@/pages/logistics-simple";
import FinancialLogin from "@/pages/financial-login";
import WarehouseLogin from "@/pages/warehouse-login";
import LogisticsLogin from "@/pages/logistics-login";
import SuperAdminDepartmentManagement from "@/pages/super-admin-department-management";
import SuperAdminSettings from "@/pages/super-admin-settings";
import SiteManagement from "@/pages/site-management";
import GeographicReports from "@/pages/geographic-reports";
import GeographicAnalytics from "@/pages/admin/geographic-analytics";
import AISettings from "@/pages/admin/ai-settings";
import FinanceOrders from "@/pages/admin/finance-orders";
import DocumentationPage from "@/pages/documentation";
import WarehouseOrders from "@/pages/admin/warehouse-orders";
import LogisticsOrders from "@/pages/admin/logistics-orders";
import DeliveredOrders from "@/pages/admin/delivered-orders";
import GlobalRefreshSettings from "@/pages/admin/global-refresh-settings";
import DepartmentUsers from "@/pages/admin/department-users";
import InventoryNotificationSettings from "@/pages/admin/inventory-notification-settings";
import InventoryManagement from "@/pages/inventory-management";
import ContentManagement from "@/pages/content-management";
import SecurityManagement from "@/pages/security-management-new";
import UnifiedInventory from "@/pages/admin/unified-inventory";
import BankReceiptUpload from "@/pages/bank-receipt-upload";
import TestLogistics from "@/pages/test-logistics";

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
          <Route path="/shop" component={Shop} />
          <Route path="/product-recommendations" component={ProductRecommendations} />
          <Route path="/checkout" component={() => <Checkout cart={[]} products={[]} onOrderComplete={() => {}} />} />
          <Route path="/payment/:orderId" component={Payment} />
          <Route path="/checkout/success/:orderId" component={CheckoutSuccess} />
          <Route path="/bank-receipt-upload/:orderId" component={BankReceiptUpload} />
          <Route path="/shop-search" component={ShopSearch} />
          <Route path="/shop-admin" component={ShopAdmin} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/users" component={AdminUsers} />

          <Route path="/admin/barcode-inventory" component={BarcodeInventory} />
          <Route path="/admin/database-management" component={DatabaseManagement} />
          <Route path="/admin/user-management" component={UserManagement} />
          <Route path="/admin/factory-management" component={FactoryManagement} />
          <Route path="/admin/procedures-management" component={ProceduresManagement} />
          <Route path="/admin/smtp-test" component={SMTPTestPage} />
          <Route path="/admin/email-settings" component={EmailSettingsPage} />
          <Route path="/admin/advanced-email-settings" component={AdvancedEmailSettingsPage} />
          <Route path="/admin/email-progress" component={EmailProgressPage} />
          <Route path="/admin/email-routing-stats" component={EmailRoutingStats} />
          <Route path="/admin/invoice-management" component={InvoiceManagement} />
          <Route path="/admin/payment-settings" component={PaymentSettings} />
          <Route path="/admin/wallet-management" component={WalletManagement} />
          <Route path="/admin/inquiries" component={Dashboard} />
          <Route path="/admin/inquiry/:id" component={InquiryDetail} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/customer/forgot-password" component={CustomerForgotPassword} />
          <Route path="/customer/reset-password" component={CustomerResetPassword} />
          <Route path="/customer/register" component={CustomerRegister} />
          <Route path="/crm" component={CRMPage} />
          <Route path="/customer/profile" component={CustomerProfile} />
          <Route path="/customer/profile/edit" component={CustomerProfileEdit} />
          <Route path="/customer/wallet" component={CustomerWallet} />
          <Route path="/category-management" component={CategoryManagement} />
          <Route path="/seo-management" component={SeoManagement} />
          <Route path="/admin/sms-management" component={AdminSmsManagement} />
          <Route path="/admin/sms" component={AdminSmsManagement} />
          <Route path="/admin/widgets" component={WidgetRecommendations} />
          <Route path="/admin/order-management" component={AdminOrderManagement} />
          <Route path="/admin/site-management" component={SiteManagement} />
          <Route path="/admin/products" component={ProductsPage} />
          <Route path="/admin/product-variants" component={ProductVariants} />
          <Route path="/admin/geographic-reports" component={GeographicReports} />
          <Route path="/admin/geographic-analytics" component={GeographicAnalytics} />
          <Route path="/admin/ai-settings" component={AISettings} />
          <Route path="/documentation" component={DocumentationPage} />
          
          {/* New Department Order Management Pages */}
          <Route path="/admin/finance-orders" component={FinanceOrders} />
          <Route path="/admin/warehouse-orders" component={WarehouseOrders} />
          <Route path="/admin/logistics-orders" component={LogisticsOrders} />
          <Route path="/admin/delivered-orders" component={DeliveredOrders} />
          <Route path="/admin/global-refresh-settings" component={GlobalRefreshSettings} />
          <Route path="/admin/department-users" component={DepartmentUsers} />
          <Route path="/admin/inventory-notification-settings" component={InventoryNotificationSettings} />
          <Route path="/admin/inventory-management" component={InventoryManagement} />
          <Route path="/admin/unified-inventory" component={UnifiedInventory} />
          <Route path="/admin/content-management" component={ContentManagement} />
          <Route path="/admin/security-management" component={SecurityManagement} />

          
          {/* Department-specific routes */}
          <Route path="/financial" component={FinancialDepartment} />
          <Route path="/financial/login" component={FinancialLogin} />
          <Route path="/warehouse" component={WarehouseDepartment} />
          <Route path="/warehouse/login" component={WarehouseLogin} />
          <Route path="/logistics-department" component={LogisticsDepartment} />
          <Route path="/logistics-full" component={LogisticsDepartment} />
          <Route path="/logistics" component={LogisticsSimple} />
          <Route path="/logistics/login" component={LogisticsLogin} />
          <Route path="/test-logistics" component={TestLogistics} />
          <Route path="/super-admin/departments" component={SuperAdminDepartmentManagement} />
          <Route path="/super-admin/settings" component={SuperAdminSettings} />
          
          <Route path="/analytics/sales" component={SalesAnalytics} />
          <Route path="/products" component={Products} />
          <Route path="/products/fuel-additives" component={FuelAdditives} />
          <Route path="/products/water-treatment" component={WaterTreatment} />
          <Route path="/products/paint-thinner" component={PaintThinner} />
          <Route path="/products/agricultural-fertilizers" component={AgriculturalFertilizers} />
          <Route path="/products/other" component={OtherProducts} />
          <Route path="/products/paint-solvents" component={PaintSolvents} />
          <Route path="/products/industrial-chemicals" component={IndustrialChemicals} />
          <Route path="/products/commercial-goods" component={CommercialGoods} />
          <Route path="/products/technical-equipment" component={TechnicalEquipment} />
          <Route path="/quote" component={QuotePage} />
          <Route path="/documentation" component={DocumentationPage} />
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
