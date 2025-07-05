import { Switch, Route } from "wouter";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Simple pages for testing
function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Momtazchem</h1>
        <p className="text-lg text-gray-600">Chemical Solutions Platform</p>
        <p className="text-sm text-green-600 mt-2">✓ React App is working</p>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About</h1>
        <p className="text-lg text-gray-600">About Momtazchem</p>
      </div>
    </div>
  );
}

export default function MinimalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <div className="min-h-screen">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/about" component={AboutPage} />
              <Route>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <h1 className="text-2xl text-gray-900">Page Not Found</h1>
                </div>
              </Route>
            </Switch>
          </div>
          <Toaster />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}