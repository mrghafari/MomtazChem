import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Package, MapPin, Clock, ScanLine, Eye, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface InternalBarcodeCardProps {
  trackingCode: {
    id: number;
    internalBarcode: string;
    productName: string;
    productSku?: string;
    quantity: number;
    currentLocation: string;
    currentDepartment: string;
    warehouseLocation?: string;
    financeProcessedAt?: string;
    warehouseProcessedAt?: string;
    logisticsProcessedAt?: string;
    deliveredAt?: string;
  };
}

const locationLabels = {
  warehouse_pending: "در انتظار انبار",
  warehouse_ready: "آماده انبار",
  logistics_assigned: "تحویل لجستیک",
  in_transit: "در حال ارسال",
  delivered: "تحویل شده",
  returned: "برگشتی"
};

const departmentLabels = {
  finance: "مالی",
  warehouse: "انبار",
  logistics: "لجستیک",
  delivered: "تحویل شده"
};

const locationColors = {
  warehouse_pending: "bg-yellow-100 text-yellow-800",
  warehouse_ready: "bg-blue-100 text-blue-800",
  logistics_assigned: "bg-purple-100 text-purple-800",
  in_transit: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  returned: "bg-red-100 text-red-800"
};

const departmentColors = {
  finance: "bg-amber-100 text-amber-800",
  warehouse: "bg-cyan-100 text-cyan-800",
  logistics: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800"
};

export default function InternalBarcodeCard({ trackingCode }: InternalBarcodeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getProgressPercentage = () => {
    if (trackingCode.deliveredAt) return 100;
    if (trackingCode.logisticsProcessedAt) return 75;
    if (trackingCode.warehouseProcessedAt) return 50;
    if (trackingCode.financeProcessedAt) return 25;
    return 0;
  };

  return (
    <Card className="border-r-4 border-r-blue-500 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-medium">{trackingCode.productName}</CardTitle>
          </div>
          <Badge 
            variant="secondary" 
            className={`${locationColors[trackingCode.currentLocation as keyof typeof locationColors]} border-0`}
          >
            {locationLabels[trackingCode.currentLocation as keyof typeof locationLabels]}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <ScanLine className="h-4 w-4" />
            <span className="font-mono">{trackingCode.internalBarcode}</span>
          </div>
          {trackingCode.productSku && (
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>{trackingCode.productSku}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>{trackingCode.quantity} عدد</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Department Badge */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <Badge 
              variant="outline" 
              className={`${departmentColors[trackingCode.currentDepartment as keyof typeof departmentColors]} border-0`}
            >
              بخش {departmentLabels[trackingCode.currentDepartment as keyof typeof departmentLabels]}
            </Badge>
            {trackingCode.warehouseLocation && (
              <span className="text-sm text-gray-600">موقعیت: {trackingCode.warehouseLocation}</span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">پیشرفت سفارش</span>
              <span className="font-medium">{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Timeline Steps */}
          <div className="flex justify-between text-xs">
            <div className={`flex flex-col items-center ${trackingCode.financeProcessedAt ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${trackingCode.financeProcessedAt ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="mt-1">مالی</span>
            </div>
            <div className={`flex flex-col items-center ${trackingCode.warehouseProcessedAt ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${trackingCode.warehouseProcessedAt ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="mt-1">انبار</span>
            </div>
            <div className={`flex flex-col items-center ${trackingCode.logisticsProcessedAt ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${trackingCode.logisticsProcessedAt ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="mt-1">لجستیک</span>
            </div>
            <div className={`flex flex-col items-center ${trackingCode.deliveredAt ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${trackingCode.deliveredAt ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="mt-1">تحویل</span>
            </div>
          </div>

          {/* Action Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                جزئیات کامل
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  تاریخچه ردیابی
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{trackingCode.productName}</p>
                  <p className="text-sm text-gray-600 font-mono">{trackingCode.internalBarcode}</p>
                  <p className="text-sm text-gray-600">{trackingCode.quantity} عدد</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    مراحل پردازش
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className={`flex justify-between p-2 rounded ${trackingCode.financeProcessedAt ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <span>بررسی مالی</span>
                      <span>{formatDate(trackingCode.financeProcessedAt)}</span>
                    </div>
                    <div className={`flex justify-between p-2 rounded ${trackingCode.warehouseProcessedAt ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <span>پردازش انبار</span>
                      <span>{formatDate(trackingCode.warehouseProcessedAt)}</span>
                    </div>
                    <div className={`flex justify-between p-2 rounded ${trackingCode.logisticsProcessedAt ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <span>تحویل لجستیک</span>
                      <span>{formatDate(trackingCode.logisticsProcessedAt)}</span>
                    </div>
                    <div className={`flex justify-between p-2 rounded ${trackingCode.deliveredAt ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <span>تحویل نهایی</span>
                      <span>{formatDate(trackingCode.deliveredAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}