import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { LanguageProvider } from "./contexts/LanguageContext";
import Header from "./components/layout/header";
import Footer from "./components/layout/footer";

// Core pages only
import Home from "./pages/home";
import About from "./pages/about";
import Services from "./pages/services";
import Contact from "./pages/contact";
import Shop from "./pages/shop";
import AdminPage from "./pages/admin";
import AdminLogin from "./pages/admin-login";

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
          <Route component={() => <div>صفحه یافت نشد</div>} />
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
            <Router />
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App Error:', error);
    return <div>خطا در بارگذاری برنامه</div>;
  }
}

export default App;