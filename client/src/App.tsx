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
import AdminPage from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import FuelAdditives from "@/pages/products/fuel-additives";
import WaterTreatment from "@/pages/products/water-treatment";
import PaintThinner from "@/pages/products/paint-thinner";
import AgriculturalFertilizers from "@/pages/products/agricultural-fertilizers";
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
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/products/fuel-additives" component={FuelAdditives} />
          <Route path="/products/water-treatment" component={WaterTreatment} />
          <Route path="/products/paint-thinner" component={PaintThinner} />
          <Route path="/products/agricultural-fertilizers" component={AgriculturalFertilizers} />
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
