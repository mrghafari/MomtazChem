import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, LogOut } from "lucide-react";

export default function LogisticsSimple() {
  const [user] = useState({ username: "logistics_test" });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Truck className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">بخش حمل و نقل</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">کاربر: {user.username}</span>
              <Button variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>صفحه بخش حمل و نقل</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              این صفحه برای مدیریت حمل و نقل سفارشات طراحی شده است.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-700">
                صفحه logistics به درستی کار می‌کند!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}