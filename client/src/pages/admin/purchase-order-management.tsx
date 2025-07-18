import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  Search,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign
} from "lucide-react";

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierName: string;
  supplierEmail: string;
  supplierPhone: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'pending' | 'approved' | 'ordered' | 'delivered' | 'cancelled';
  totalAmount: number;
  currency: string;
  items: PurchaseOrderItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseOrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications: string;
}

const statusLabels = {
  'pending': 'در انتظار تایید',
  'approved': 'تایید شده',
  'ordered': 'سفارش داده شده',
  'delivered': 'تحویل داده شده',
  'cancelled': 'لغو شده'
};

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-blue-100 text-blue-800',
  'ordered': 'bg-purple-100 text-purple-800',
  'delivered': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800'
};

export default function PurchaseOrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch purchase orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/purchase-orders'],
    queryFn: () => fetch('/api/purchase-orders', { credentials: 'include' })
      .then(res => res.json())
      .then(data => data.success ? data.data : [])
  });

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order: PurchaseOrder) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group orders by status for dashboard
  const ordersByStatus = orders.reduce((acc: any, order: PurchaseOrder) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const totalValue = orders.reduce((sum: number, order: PurchaseOrder) => sum + order.totalAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              مدیریت سفارشات خرید
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              مدیریت سفارشات خرید از تامین‌کنندگان
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            سفارش جدید
          </Button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="mr-4">
                  <p className="text-2xl font-semibold">{ordersByStatus.pending || 0}</p>
                  <p className="text-sm text-gray-600">در انتظار</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-blue-600" />
                <div className="mr-4">
                  <p className="text-2xl font-semibold">{ordersByStatus.approved || 0}</p>
                  <p className="text-sm text-gray-600">تایید شده</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-purple-600" />
                <div className="mr-4">
                  <p className="text-2xl font-semibold">{ordersByStatus.ordered || 0}</p>
                  <p className="text-sm text-gray-600">سفارش داده شده</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="mr-4">
                  <p className="text-2xl font-semibold">{ordersByStatus.delivered || 0}</p>
                  <p className="text-sm text-gray-600">تحویل شده</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div className="mr-4">
                  <p className="text-2xl font-semibold">{totalValue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">ارزش کل (IQD)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="جستجو بر اساس شماره سفارش یا نام تامین‌کننده..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار</option>
                <option value="approved">تایید شده</option>
                <option value="ordered">سفارش داده شده</option>
                <option value="delivered">تحویل شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              سفارشات خرید ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">در حال بارگیری...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">هیچ سفارش خریدی یافت نشد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order: PurchaseOrder) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                            <p className="text-gray-600">{order.supplierName}</p>
                          </div>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">تاریخ سفارش:</span>
                            <br />
                            {new Date(order.orderDate).toLocaleDateString('fa-IR')}
                          </div>
                          <div>
                            <span className="font-medium">تاریخ تحویل:</span>
                            <br />
                            {new Date(order.expectedDeliveryDate).toLocaleDateString('fa-IR')}
                          </div>
                          <div>
                            <span className="font-medium">تعداد اقلام:</span>
                            <br />
                            {order.items?.length || 0} قلم
                          </div>
                          <div>
                            <span className="font-medium">مبلغ کل:</span>
                            <br />
                            {order.totalAmount.toLocaleString()} {order.currency}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}