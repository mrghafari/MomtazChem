import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Store, UserPlus, LogIn, Package, TrendingUp, Shield } from "lucide-react";

export default function VendorPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Vendor Portal
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join Momtazchem's marketplace and reach thousands of customers. Manage your products, track orders, and grow your business with our powerful vendor platform.
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Register Card */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 mx-auto group-hover:scale-110 transition-transform">
                <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Become a Vendor</CardTitle>
              <CardDescription className="text-base">
                New to Momtazchem? Register your business and start selling today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Shield className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Quick and secure registration process</span>
                </li>
                <li className="flex items-start">
                  <Package className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Full control over your product catalog</span>
                </li>
                <li className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Access to growing customer base</span>
                </li>
              </ul>
              <Link href="/vendor-registration">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
                  data-testid="button-register-vendor"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Register as Vendor
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Login Card */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-500">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4 mx-auto group-hover:scale-110 transition-transform">
                <LogIn className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Vendor Login</CardTitle>
              <CardDescription className="text-base">
                Already a vendor? Access your dashboard and manage your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Package className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Manage products and inventory</span>
                </li>
                <li className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Track orders and sales analytics</span>
                </li>
                <li className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Secure vendor dashboard</span>
                </li>
              </ul>
              <Link href="/vendor/login">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                  data-testid="button-login-vendor"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Login to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-white">Why Sell on Momtazchem?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">40+</div>
                <div className="text-blue-100">Countries Reached</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">1000+</div>
                <div className="text-blue-100">Active Customers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">Support & Analytics</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href="/">
            <Button variant="outline" size="lg" data-testid="button-back-home">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
