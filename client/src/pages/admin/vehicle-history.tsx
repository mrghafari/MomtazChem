import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, CalendarDateRangePicker } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Car, Package, TrendingUp, Clock, Star, MapPin, Calendar as CalendarIcon, Search, Filter } from "lucide-react";

// Types for vehicle history
interface VehicleDeliveryHistory {
  id: number;
  plateNumber: string;
  customerOrderId: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  originAddress: string;
  destinationAddress: string;
  totalWeight: number;
  deliveryCost: number;
  deliveryStatus: string;
  deliveryDateTime: string;
  onTimeDelivery: boolean;
  customerRating?: number;
  customerFeedback?: string;
  itemsDescription?: string;
  deliveryDistance?: number;
  driverName?: string;
}

interface VehicleUsageStats {
  id: number;
  plateNumber: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  totalDistance: number;
  totalWeight: number;
  totalRevenue: number;
  averageRating: number;
  onTimeDeliveryRate: number;
  firstDeliveryDate?: string;
  lastDeliveryDate?: string;
}

interface VehicleSummary {
  vehicle: {
    id: number;
    plateNumber: string;
    vehicleType: string;
    make?: string;
    model?: string;
    maxWeight: number;
  };
  stats: VehicleUsageStats;
  recentDeliveries: VehicleDeliveryHistory[];
}

export default function VehicleHistoryPage() {
  const [selectedPlate, setSelectedPlate] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchPlate, setSearchPlate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Get vehicle delivery history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: [
      '/api/logistics/vehicle-history',
      selectedPlate,
      currentPage,
      pageSize,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString()
    ],
    queryFn: () => apiRequest('/api/logistics/vehicle-history', {
      method: 'GET',
      params: {
        plateNumber: selectedPlate,
        page: currentPage,
        limit: pageSize,
        startDate: dateRange.from?.toISOString(),
        endDate: dateRange.to?.toISOString()
      }
    }),
    enabled: !!selectedPlate
  });

  // Get vehicle usage statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/logistics/vehicle-stats'],
    queryFn: () => apiRequest('/api/logistics/vehicle-stats')
  });

  // Get vehicle summary for selected plate
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/logistics/vehicle-summary', selectedPlate],
    queryFn: () => apiRequest(`/api/logistics/vehicle-summary/${selectedPlate}`),
    enabled: !!selectedPlate
  });

  const handlePlateSearch = () => {
    if (searchPlate.trim()) {
      setSelectedPlate(searchPlate.trim().toUpperCase());
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.pending}>
        {status === 'completed' ? 'مکمل' : 
         status === 'failed' ? 'ناکام' :
         status === 'cancelled' ? 'لغو شده' : 'در انتظار'}
      </Badge>
    );
  };

  const renderStatsCards = () => {
    if (!summaryData?.data?.stats) return null;
    
    const stats = summaryData.data.stats;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل تحویل‌ها</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              موفق: {stats.successfulDeliveries} | ناموفق: {stats.failedDeliveries}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل مسافت</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.totalDistance)} km</div>
            <p className="text-xs text-muted-foreground">
              میانگین: {stats.totalDeliveries > 0 ? Math.round(stats.totalDistance / stats.totalDeliveries) : 0} km/تحویل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل درآمد</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              میانگین: {formatCurrency(stats.totalDeliveries > 0 ? stats.totalRevenue / stats.totalDeliveries : 0)}/تحویل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نرخ به موقع بودن</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.onTimeDeliveryRate)}%</div>
            <p className="text-xs text-muted-foreground">
              امتیاز مشتری: {stats.averageRating ? `${stats.averageRating.toFixed(1)}/5` : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">تاریخچه تحویل خودروها</h1>
          <p className="text-muted-foreground">
            مدیریت و پیگیری تاریخچه تحویلات هر خودرو بر اساس پلاک
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            جستجو خودرو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search-plate">شماره پلاک</Label>
              <Input
                id="search-plate"
                placeholder="مثال: ABC123"
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePlateSearch()}
              />
            </div>
            <Button onClick={handlePlateSearch} disabled={!searchPlate.trim()}>
              جستجو
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 ml-2" />
              فیلتر
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>از تاریخ</Label>
                  <Input
                    type="date"
                    value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDateRange(prev => ({ 
                      ...prev, 
                      from: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                  />
                </div>
                <div>
                  <Label>تا تاریخ</Label>
                  <Input
                    type="date"
                    value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDateRange(prev => ({ 
                      ...prev, 
                      to: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Statistics Cards */}
      {selectedPlate && summaryData?.data && renderStatsCards()}

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">تاریخچه تحویلات</TabsTrigger>
          <TabsTrigger value="summary">خلاصه آمار</TabsTrigger>
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
        </TabsList>

        {/* Delivery History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>تاریخچه تحویلات</CardTitle>
              <CardDescription>
                {selectedPlate ? `تاریخچه تحویلات برای خودرو ${selectedPlate}` : 'خودرو مورد نظر را انتخاب کنید'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPlate && historyData?.data ? (
                <div className="space-y-4">
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>شماره سفارش</TableHead>
                          <TableHead>مشتری</TableHead>
                          <TableHead>مقصد</TableHead>
                          <TableHead>وزن</TableHead>
                          <TableHead>هزینه</TableHead>
                          <TableHead>وضعیت</TableHead>
                          <TableHead>تاریخ تحویل</TableHead>
                          <TableHead>امتیاز</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyData.data.map((delivery: VehicleDeliveryHistory) => (
                          <TableRow key={delivery.id}>
                            <TableCell className="font-medium">
                              {delivery.orderNumber}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{delivery.customerName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {delivery.customerPhone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{delivery.destinationAddress}</div>
                                {delivery.deliveryDistance && (
                                  <div className="text-muted-foreground">
                                    {delivery.deliveryDistance} km
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{delivery.totalWeight} kg</TableCell>
                            <TableCell>{formatCurrency(delivery.deliveryCost)}</TableCell>
                            <TableCell>{getStatusBadge(delivery.deliveryStatus)}</TableCell>
                            <TableCell>
                              {delivery.deliveryDateTime ? 
                                format(new Date(delivery.deliveryDateTime), 'yyyy/MM/dd HH:mm') : 
                                'نامشخص'
                              }
                            </TableCell>
                            <TableCell>
                              {delivery.customerRating ? (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{delivery.customerRating}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">بدون امتیاز</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  {/* Pagination */}
                  {historyData.pagination && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        نمایش {((currentPage - 1) * pageSize) + 1} تا {Math.min(currentPage * pageSize, historyData.pagination.total)} از {historyData.pagination.total} رکورد
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          قبلی
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => p + 1)}
                          disabled={currentPage >= historyData.pagination.totalPages}
                        >
                          بعدی
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedPlate ? 'در حال بارگذاری...' : 'برای مشاهده تاریخچه، شماره پلاک خودرو را جستجو کنید'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>خلاصه آمار خودرو</CardTitle>
              <CardDescription>
                {selectedPlate ? `آمار کلی برای خودرو ${selectedPlate}` : 'خودرو مورد نظر را انتخاب کنید'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPlate && summaryData?.data ? (
                <div className="space-y-6">
                  {/* Vehicle Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">اطلاعات خودرو</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">پلاک:</span>
                          <span>{summaryData.data.vehicle?.plateNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">نوع خودرو:</span>
                          <span>{summaryData.data.vehicle?.vehicleType}</span>
                        </div>
                        {summaryData.data.vehicle?.make && (
                          <div className="flex justify-between">
                            <span className="font-medium">برند:</span>
                            <span>{summaryData.data.vehicle.make} {summaryData.data.vehicle.model}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="font-medium">حداکثر وزن:</span>
                          <span>{summaryData.data.vehicle?.maxWeight} kg</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">آمار عملکرد</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">کل تحویلات:</span>
                          <span>{summaryData.data.stats?.totalDeliveries || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">نرخ موفقیت:</span>
                          <span>
                            {summaryData.data.stats?.totalDeliveries ? 
                              Math.round((summaryData.data.stats.successfulDeliveries / summaryData.data.stats.totalDeliveries) * 100) : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">کل وزن حمل شده:</span>
                          <span>{Math.round(summaryData.data.stats?.totalWeight || 0)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">کل درآمد:</span>
                          <span>{formatCurrency(summaryData.data.stats?.totalRevenue || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Deliveries */}
                  {summaryData.data.recentDeliveries?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">آخرین تحویلات</h3>
                      <div className="space-y-2">
                        {summaryData.data.recentDeliveries.slice(0, 5).map((delivery: VehicleDeliveryHistory) => (
                          <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{delivery.orderNumber}</div>
                              <div className="text-sm text-muted-foreground">{delivery.customerName}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">{formatCurrency(delivery.deliveryCost)}</div>
                              <div className="text-xs text-muted-foreground">
                                {delivery.deliveryDateTime ? 
                                  format(new Date(delivery.deliveryDateTime), 'MM/dd') : 
                                  'نامشخص'
                                }
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedPlate ? 'در حال بارگذاری...' : 'برای مشاهده خلاصه آمار، شماره پلاک خودرو را جستجو کنید'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>نمای کلی ناوگان</CardTitle>
              <CardDescription>آمار کلی تمامی خودروها</CardDescription>
            </CardHeader>
            <CardContent>
              {statsData?.data?.length > 0 ? (
                <div className="space-y-4">
                  <ScrollArea className="h-[500px]">
                    <div className="grid gap-4">
                      {statsData.data.map((stat: VehicleUsageStats) => (
                        <Card key={stat.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Car className="h-8 w-8 text-blue-500" />
                              <div>
                                <h3 className="font-semibold text-lg">{stat.plateNumber}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {stat.totalDeliveries} تحویل | {Math.round(stat.totalDistance)} km
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{formatCurrency(stat.totalRevenue)}</div>
                              <div className="text-sm text-muted-foreground">
                                {Math.round(stat.onTimeDeliveryRate)}% به موقع
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold text-green-600">
                                {stat.successfulDeliveries}
                              </div>
                              <div className="text-xs text-muted-foreground">موفق</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-red-600">
                                {stat.failedDeliveries}
                              </div>
                              <div className="text-xs text-muted-foreground">ناموفق</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-yellow-600">
                                {stat.averageRating ? stat.averageRating.toFixed(1) : 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">امتیاز</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  هنوز داده‌ای برای نمایش وجود ندارد
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}