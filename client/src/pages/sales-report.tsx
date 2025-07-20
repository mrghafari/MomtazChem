import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Calendar, TrendingUp, Package, DollarSign, FileText, Printer } from "lucide-react";
import { format } from "date-fns";

interface SalesReportData {
  totalSales: number;
  totalOrders: number;
  totalQuantity: number;
  productSales: Array<{
    productName: string;
    quantity: number;
    totalAmount: number;
    orders: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  topProducts: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function SalesReport() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to last 7 days
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: reportData, isLoading, refetch } = useQuery<SalesReportData>({
    queryKey: ["/api/reports/sales", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      });
      const response = await fetch(`/api/reports/sales?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sales report: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!startDate && !!endDate,
  });

  const handleGenerateReport = () => {
    refetch();
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number, currency: string = 'IQD') => {
    const validCurrencies = ['USD', 'EUR', 'IQD'];
    const currencyCode = validCurrencies.includes(currency) ? currency : 'IQD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };

  const formatQuantity = (quantity: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(quantity);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Generating sales report...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:bg-white print:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 print:mb-4">
          <div className="flex items-center justify-between mb-6 print:mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">Daily Sales Report</h1>
              <p className="text-gray-600 print:text-sm">
                Comprehensive sales analysis for {formatDate(startDate)} to {formatDate(endDate)}
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
            </div>
          </div>

          {/* Date Range Selector */}
          <Card className="print:hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <Label htmlFor="start-date">From:</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="end-date">To:</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Button onClick={handleGenerateReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {reportData && (
          <>
            {/* Summary Cards - Hidden in print */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:hidden">
              <Card>
                <CardContent className="p-6 print:p-4">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Sales</p>
                      <p className="text-2xl font-bold text-gray-900 print:text-xl">
                        {formatCurrency(reportData.totalSales)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 print:p-4">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900 print:text-xl">
                        {reportData.totalOrders}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 print:p-4">
                  <div className="flex items-center">
                    <Package className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                      <p className="text-2xl font-bold text-gray-900 print:text-xl">
                        {reportData.totalQuantity}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 print:p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Average Order</p>
                      <p className="text-2xl font-bold text-gray-900 print:text-xl">
                        {formatCurrency(reportData.totalOrders > 0 ? reportData.totalSales / reportData.totalOrders : 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts - Hidden in print */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print:hidden print:mb-4 print:gap-4">
              {/* Product Sales Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Sales Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 print:h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.topProducts}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reportData.topProducts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Sales Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 print:h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.dailyBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                        />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                          labelFormatter={(value) => format(new Date(value as string), 'MMM dd, yyyy')}
                          formatter={(value) => [formatCurrency(value as number), 'Sales']}
                        />
                        <Bar dataKey="sales" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Print-Only Summary Section */}
            <div className="hidden print:block print:mb-4">
              <div className="print:summary-box">
                <div>
                  <strong>Total Sales:</strong> {formatCurrency(reportData.totalSales)}
                </div>
                <div>
                  <strong>Total Orders:</strong> {reportData.totalOrders}
                </div>
                <div>
                  <strong>Period:</strong> {formatDate(startDate)} to {formatDate(endDate)}
                </div>
              </div>
            </div>

            {/* Detailed Product Sales Table */}
            <Card className="print:no-shadow">
              <CardHeader className="print:p-2">
                <CardTitle className="print:text-lg print:mb-2">Product Sales Details</CardTitle>
              </CardHeader>
              <CardContent className="print:p-2">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse print:compact-table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-gray-900 print:text-sm">Product Name</th>
                        <th className="text-right p-3 font-semibold text-gray-900 print:text-sm">Qty Sold</th>
                        <th className="text-right p-3 font-semibold text-gray-900 print:text-sm">Total Sales</th>
                        <th className="text-right p-3 font-semibold text-gray-900 print:text-sm">Orders</th>
                        <th className="text-right p-3 font-semibold text-gray-900 print:text-sm">Avg/Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.productSales.map((product, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 print:text-sm">
                            <div className="font-medium text-gray-900">{product.productName}</div>
                          </td>
                          <td className="p-3 text-right print:text-sm">
                            <Badge variant="secondary" className="print:hidden">{formatQuantity(product.quantity)} units</Badge>
                            <span className="hidden print:inline">{formatQuantity(product.quantity)}</span>
                          </td>
                          <td className="p-3 text-right font-semibold text-green-600 print:text-sm">
                            {formatCurrency(product.totalAmount)}
                          </td>
                          <td className="p-3 text-right print:text-sm">{product.orders}</td>
                          <td className="p-3 text-right text-gray-600 print:text-sm">
                            {formatCurrency(product.orders > 0 ? product.totalAmount / product.orders : 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-gray-50">
                        <td className="p-3 font-bold text-gray-900 print:text-sm">TOTAL</td>
                        <td className="p-3 text-right font-bold print:text-sm">
                          <Badge variant="default" className="print:hidden">{formatQuantity(reportData.totalQuantity)} units</Badge>
                          <span className="hidden print:inline font-bold">{formatQuantity(reportData.totalQuantity)}</span>
                        </td>
                        <td className="p-3 text-right font-bold text-green-600 print:text-sm">
                          {formatCurrency(reportData.totalSales)}
                        </td>
                        <td className="p-3 text-right font-bold print:text-sm">{reportData.totalOrders}</td>
                        <td className="p-3 text-right font-bold text-gray-600 print:text-sm">
                          {formatCurrency(reportData.totalOrders > 0 ? reportData.totalSales / reportData.totalOrders : 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Print Footer */}
            <div className="print:block hidden mt-8 pt-4 border-t text-center text-sm text-gray-500">
              <p>Report generated on {format(new Date(), 'MMMM dd, yyyy at HH:mm')}</p>
              <p>Momtazchem Sales Analytics - Confidential</p>
            </div>
          </>
        )}

        {!reportData && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
              <p className="text-gray-500 mb-6">
                Select a date range and click "Generate Report" to view sales data.
              </p>
              <Button onClick={handleGenerateReport}>
                Generate Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          /* Hide all interactive elements and decorative content */
          .print\\:hidden,
          button,
          .lucide,
          .print\\:hide-charts {
            display: none !important;
          }
          
          /* Hide chart containers completely */
          .print\\:hide-charts {
            display: none !important;
          }
          
          /* Show only essential elements */
          .print\\:block {
            display: block !important;
          }
          
          .print\\:table {
            display: table !important;
          }
          
          /* Clean white background */
          .print\\:bg-white,
          body,
          * {
            background-color: white !important;
            background-image: none !important;
          }
          
          /* Compact spacing */
          .print\\:p-2 {
            padding: 0.5rem !important;
          }
          
          .print\\:mb-2 {
            margin-bottom: 0.5rem !important;
          }
          
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          
          /* Typography optimization */
          .print\\:text-lg {
            font-size: 1.125rem !important;
            font-weight: bold !important;
          }
          
          .print\\:text-base {
            font-size: 1rem !important;
          }
          
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
          
          /* Remove shadows and borders */
          .print\\:no-shadow {
            box-shadow: none !important;
            border: 1px solid #e5e5e5 !important;
          }
          
          /* Table optimization */
          .print\\:compact-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          
          .print\\:compact-table th,
          .print\\:compact-table td {
            padding: 0.25rem 0.5rem !important;
            border: 1px solid #ddd !important;
            font-size: 0.875rem !important;
          }
          
          .print\\:compact-table th {
            background-color: #f8f9fa !important;
            font-weight: bold !important;
          }
          
          /* Hide unnecessary decorative elements */
          .print\\:essential-only .grid:not(.print\\:keep) {
            display: none !important;
          }
          
          /* Essential summary box */
          .print\\:summary-box {
            display: flex !important;
            justify-content: space-between !important;
            padding: 1rem !important;
            border: 2px solid #000 !important;
            margin-bottom: 1rem !important;
            background-color: #f8f9fa !important;
          }
          
          /* Remove color styling for print */
          * {
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .text-green-600,
          .text-blue-600,
          .text-orange-600 {
            color: black !important;
            font-weight: bold !important;
          }
        }
      `}</style>
    </div>
  );
}