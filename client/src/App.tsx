import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import About from "@/pages/about";
import Services from "@/pages/services";
import Contact from "@/pages/contact";
import Shop from "@/pages/shop";
import Checkout from "@/pages/checkout";
import ShopAdmin from "@/pages/shop-admin";
import AdminPage from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import AdminUsers from "@/pages/admin-users";
import SpecialistsAdmin from "@/pages/admin/specialists";
import BarcodeInventory from "@/pages/admin/barcode-inventory";
import DatabaseManagement from "@/pages/admin/database-management";
import UserManagement from "@/pages/admin/user-management";
import SMTPTestPage from "@/pages/admin/smtp-test";
import EmailSettingsPage from "@/pages/admin/email-settings";
import AdvancedEmailSettingsPage from "@/pages/admin/advanced-email-settings";
import EmailProgressPage from "@/pages/admin/email-progress";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import CRMPage from "@/pages/crm";
import SalesAnalytics from "@/pages/sales-analytics";
import FuelAdditives from "@/pages/products/fuel-additives";
import WaterTreatment from "@/pages/products/water-treatment";
import PaintThinner from "@/pages/products/paint-thinner";
import AgriculturalFertilizers from "@/pages/products/agricultural-fertilizers";
import QuotePage from "@/pages/quote";
import Dashboard from "@/pages/dashboard";
import InquiryDetail from "@/pages/inquiry-detail";
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
          <Route path="/shop-admin" component={ShopAdmin} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/specialists" component={SpecialistsAdmin} />
          <Route path="/admin/barcode-inventory" component={BarcodeInventory} />
          <Route path="/admin/database-management" component={DatabaseManagement} />
          <Route path="/admin/smtp-test" component={SMTPTestPage} />
          <Route path="/admin/email-settings" component={EmailSettingsPage} />
          <Route path="/admin/advanced-email-settings" component={AdvancedEmailSettingsPage} />
          <Route path="/admin/email-progress" component={EmailProgressPage} />
          <Route path="/admin/inquiries" component={Dashboard} />
          <Route path="/admin/inquiry/:id" component={InquiryDetail} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/crm" component={CRMPage} />
          <Route path="/analytics/sales" component={SalesAnalytics} />
          <Route path="/products/fuel-additives" component={FuelAdditives} />
          <Route path="/products/water-treatment" component={WaterTreatment} />
          <Route path="/products/paint-thinner" component={PaintThinner} />
          <Route path="/products/agricultural-fertilizers" component={AgriculturalFertilizers} />
          <Route path="/quote" component={QuotePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
