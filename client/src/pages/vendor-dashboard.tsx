import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Eye,
  Edit,
  LogOut,
  Plus
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VendorDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch vendor profile
  const { data: vendorData, isLoading: isLoadingVendor } = useQuery({
    queryKey: ["/api/vendor/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/vendor/auth/me");
      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/vendor/login");
          throw new Error("احراز هویت نشده");
        }
        throw new Error("خطا در دریافت اطلاعات");
      }
      return response.json();
    },
  });

  // Fetch vendor products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/vendor/products"],
    enabled: !!vendorData?.user,
    queryFn: async () => {
      const response = await fetch("/api/vendor/products");
      if (!response.ok) throw new Error("خطا در دریافت محصولات");
      return response.json();
    },
  });

  // Fetch vendor orders
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["/api/vendor/orders"],
    enabled: !!vendorData?.user,
    queryFn: async () => {
      const response = await fetch("/api/vendor/orders");
      if (!response.ok) throw new Error("خطا در دریافت سفارشات");
      return response.json();
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ["/api/vendor/stats"],
    enabled: !!vendorData?.user,
    queryFn: async () => {
      const response = await fetch("/api/vendor/stats");
      if (!response.ok) throw new Error("خطا در دریافت آمار");
      return response.json();
    },
  });

  const handleLogout = async () => {
    try {
      await apiRequest("/api/vendor/auth/logout", { method: "POST" });
      toast({
        title: "✅ خروج موفق",
        description: "با موفقیت از حساب خود خارج شدید",
      });
      setLocation("/vendor/login");
    } catch (error) {
      toast({
        title: "❌ خطا",
        description: "خطا در خروج از حساب",
        variant: "destructive",
      });
    }
  };

  if (isLoadingVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!vendorData?.user) {
    return null;
  }

  const vendor = vendorData.user;
  const products = Array.isArray(productsData?.products) 
    ? productsData.products 
    : Array.isArray(productsData?.data) 
      ? productsData.data 
      : [];
  const orders = Array.isArray(ordersData?.orders)
    ? ordersData.orders
    : Array.isArray(ordersData?.data)
      ? ordersData.data
      : [];
  const stats = statsData?.stats || statsData?.data || {
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {vendor.logoUrl ? (
                <img
                  src={`/api/s3/serve/vendor-logos/${vendor.logoUrl}`}
                  alt={vendor.vendorName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{vendor.vendorName}</h1>
                <p className="text-sm text-muted-foreground">{vendor.contactEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={vendor.isActive ? "default" : "secondary"}>
                {vendor.isActive ? "فعال" : "غیرفعال"}
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">محصولات</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeProducts} محصول فعال
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">سفارشات</CardTitle>
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                کل سفارشات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">درآمد</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRevenue?.toLocaleString()} IQD
              </div>
              <p className="text-xs text-muted-foreground">
                کل درآمد
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">رشد</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+12%</div>
              <p className="text-xs text-muted-foreground">
                نسبت به ماه قبل
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="products">محصولات</TabsTrigger>
            <TabsTrigger value="orders">سفارشات</TabsTrigger>
            <TabsTrigger value="profile">پروفایل</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>محصولات من</CardTitle>
                    <CardDescription>
                      مدیریت و ویرایش محصولات فروشگاه
                    </CardDescription>
                  </div>
                  <Link href="/vendor/products/new">
                    <Button data-testid="button-add-product">
                      <Plus className="w-4 h-4 mr-2" />
                      افزودن محصول
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">هنوز محصولی اضافه نکرده‌اید</p>
                    <Link href="/vendor/products/new">
                      <Button className="mt-4" variant="outline">
                        افزودن اولین محصول
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product: any) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <h3 className="font-medium">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {product.price?.toLocaleString()} IQD
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? "فعال" : "غیرفعال"}
                          </Badge>
                          <Link href={`/vendor/products/${product.id}`}>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>سفارشات</CardTitle>
                <CardDescription>
                  لیست سفارشات محصولات شما
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">هنوز سفارشی ثبت نشده است</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium">سفارش #{order.orderNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.customerName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.total?.toLocaleString()} IQD</p>
                          <Badge>{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>اطلاعات فروشگاه</CardTitle>
                    <CardDescription>
                      مشاهده و ویرایش اطلاعات فروشگاه
                    </CardDescription>
                  </div>
                  <Link href="/vendor/profile/edit">
                    <Button variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      ویرایش
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-1">نام شرکت</h3>
                    <p className="text-muted-foreground">{vendor.vendorName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">ایمیل</h3>
                    <p className="text-muted-foreground">{vendor.contactEmail}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">تلفن</h3>
                    <p className="text-muted-foreground">{vendor.contactPhone}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">شهر</h3>
                    <p className="text-muted-foreground">
                      {vendor.city}, {vendor.country}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="font-medium mb-1">آدرس</h3>
                    <p className="text-muted-foreground">{vendor.address}</p>
                  </div>
                  {vendor.description && (
                    <div className="md:col-span-2">
                      <h3 className="font-medium mb-1">درباره فروشگاه</h3>
                      <p className="text-muted-foreground">{vendor.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
