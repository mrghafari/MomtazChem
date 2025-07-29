import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Globe, 
  Target, 
  TrendingUp, 
  Users, 
  BarChart3, 
  MapPin, 
  DollarSign, 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  RefreshCw,
  Building2,
  Flag,
  Zap,
  PieChart,
  Activity,
  Calendar,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarketData {
  id: number;
  country: string;
  countryCode: string;
  region: string;
  marketSize: number;
  growthRate: number;
  competitionLevel: 'low' | 'medium' | 'high';
  marketPotential: 'low' | 'medium' | 'high' | 'very_high';
  entryBarriers: string[];
  keyCustomers: string[];
  distributionChannels: string[];
  regulatoryRequirements: string;
  estimatedRevenue: number;
  marketEntryDate: string;
  status: 'researched' | 'targeted' | 'entered' | 'active' | 'paused';
  priority: 1 | 2 | 3 | 4 | 5;
  notes: string;
  lastUpdated: string;
  createdAt: string;
}

interface MarketSegment {
  id: number;
  name: string;
  description: string;
  targetCountries: string[];
  productCategories: string[];
  customerProfile: string;
  marketSize: number;
  competitorAnalysis: string;
  pricingStrategy: string;
  marketingApproach: string;
  isActive: boolean;
  createdAt: string;
}

const INTERNATIONAL_REGIONS = {
  'middle_east': { name: 'خاورمیانه', color: 'bg-amber-50 border-amber-200 text-amber-800', countries: ['UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Oman', 'Bahrain', 'Jordan', 'Lebanon'] },
  'gulf': { name: 'کشورهای حوزه خلیج فارس', color: 'bg-blue-50 border-blue-200 text-blue-800', countries: ['UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Oman', 'Bahrain'] },
  'asia': { name: 'آسیا', color: 'bg-green-50 border-green-200 text-green-800', countries: ['India', 'Pakistan', 'Bangladesh', 'Afghanistan', 'Turkey', 'Azerbaijan'] },
  'europe': { name: 'اروپا', color: 'bg-purple-50 border-purple-200 text-purple-800', countries: ['Germany', 'Netherlands', 'Belgium', 'France', 'Italy', 'Spain'] },
  'africa': { name: 'آفریقا', color: 'bg-orange-50 border-orange-200 text-orange-800', countries: ['Egypt', 'Nigeria', 'South Africa', 'Morocco', 'Algeria', 'Tunisia'] },
  'americas': { name: 'قارۀ آمریکا', color: 'bg-cyan-50 border-cyan-200 text-cyan-800', countries: ['USA', 'Canada', 'Brazil', 'Argentina', 'Mexico', 'Chile'] }
};

const MARKET_PRIORITIES = {
  1: { name: 'بسیار بالا', color: 'bg-red-100 text-red-800 border-red-200', icon: '🔥' },
  2: { name: 'بالا', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '⚡' },  
  3: { name: 'متوسط', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⭐' },
  4: { name: 'پایین', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📝' },
  5: { name: 'بسیار پایین', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '📋' }
};

const MARKET_STATUS = {
  'researched': { name: 'تحقیق شده', color: 'bg-gray-100 text-gray-800', icon: Search },
  'targeted': { name: 'هدف‌گذاری شده', color: 'bg-yellow-100 text-yellow-800', icon: Target },
  'entered': { name: 'ورود انجام شده', color: 'bg-blue-100 text-blue-800', icon: MapPin },
  'active': { name: 'فعال', color: 'bg-green-100 text-green-800', icon: Activity },
  'paused': { name: 'متوقف شده', color: 'bg-red-100 text-red-800', icon: Calendar }
};

const MarketingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('international-markets');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [editingMarket, setEditingMarket] = useState<MarketData | null>(null);
  const [newMarketDialog, setNewMarketDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for demonstration - in real implementation, this would come from database
  const mockMarketData: MarketData[] = [
    {
      id: 1,
      country: 'امارات متحده عربی',
      countryCode: 'UAE',
      region: 'gulf',
      marketSize: 85000000,
      growthRate: 12.5,
      competitionLevel: 'medium',
      marketPotential: 'very_high',
      entryBarriers: ['مجوزهای واردات', 'استانداردهای کیفیت', 'شراکت محلی'],
      keyCustomers: ['ADNOC', 'Dubai Municipality', 'Sharjah Chemical Co'],
      distributionChannels: ['توزیع‌کنندگان محلی', 'نمایندگی مستقیم', 'تجارت الکترونیک'],
      regulatoryRequirements: 'مجوز وزارت بهداشت امارات و استاندارد Emirates Authority',
      estimatedRevenue: 2500000,
      marketEntryDate: '2024-06-01',
      status: 'targeted',
      priority: 1,
      notes: 'بازار بسیار امیدوارکننده با تقاضای بالا برای مواد شیمیایی صنعتی',
      lastUpdated: '2024-01-15',
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      country: 'عربستان سعودی',
      countryCode: 'SAU',
      region: 'gulf',
      marketSize: 120000000,
      growthRate: 15.2,
      competitionLevel: 'high',
      marketPotential: 'very_high',
      entryBarriers: ['سرمایه‌گذاری بالا', 'رقابت شدید', 'الزامات محلی‌سازی'],
      keyCustomers: ['SABIC', 'Aramco', 'Riyadh Municipality'],
      distributionChannels: ['شراکت راهبردی', 'توزیع‌کنندگان بزرگ'],
      regulatoryRequirements: 'مجوز SFDA و استانداردهای صنعتی عربستان',
      estimatedRevenue: 4200000,
      marketEntryDate: '2024-09-01',
      status: 'researched',
      priority: 1,
      notes: 'بزرگترین بازار منطقه با چالش‌های ورود قابل توجه',
      lastUpdated: '2024-01-20',
      createdAt: '2024-01-05'
    },
    {
      id: 3,
      country: 'ترکیه',
      countryCode: 'TUR',
      region: 'asia',
      marketSize: 95000000,
      growthRate: 8.7,
      competitionLevel: 'medium',
      marketPotential: 'high',
      entryBarriers: ['نوسانات ارزی', 'بوروکراسی', 'زبان و فرهنگ'],
      keyCustomers: ['Petkim', 'Aksa Akrilik', 'Turkish Ministry of Agriculture'],
      distributionChannels: ['نمایندگی محلی', 'توزیع‌کنندگان منطقه‌ای'],
      regulatoryRequirements: 'مجوز وزارت بهداشت ترکیه و REACH compliance',
      estimatedRevenue: 1800000,
      marketEntryDate: '2024-08-01',
      status: 'entered',
      priority: 2,
      notes: 'بازار با پتانسیل خوب و دسترسی به اروپا',
      lastUpdated: '2024-01-18',
      createdAt: '2024-01-08'
    }
  ];

  const mockSegmentData: MarketSegment[] = [
    {
      id: 1,
      name: 'مواد شیمیایی کشاورزی خلیج فارس',
      description: 'تمرکز بر کودهای تخصصی و محصولات محافظت گیاهان برای کشورهای حوزه خلیج فارس',
      targetCountries: ['UAE', 'Saudi Arabia', 'Kuwait', 'Qatar'],
      productCategories: ['NPK Fertilizers', 'Plant Protection', 'Soil Conditioners'],
      customerProfile: 'مزارع بزرگ تجاری، شرکت‌های کشاورزی، وزارتخانه‌های کشاورزی',
      marketSize: 45000000,
      competitorAnalysis: 'رقبای اصلی: Yara، ICL، OCP Group',
      pricingStrategy: 'قیمت‌گذاری رقابتی با تأکید بر کیفیت بالا',
      marketingApproach: 'نمایشگاه‌های تخصصی، مارکتینگ دیجیتال، روابط B2B',
      isActive: true,
      createdAt: '2024-01-10'
    }
  ];

  const filteredMarkets = selectedRegion === 'all' 
    ? mockMarketData 
    : mockMarketData.filter(market => market.region === selectedRegion);

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ماژول مارکتینگ بین‌المللی</h1>
            <p className="text-gray-600 mt-1">شناسایی و تحلیل بازارهای هدف در خارج از کشور</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">بازارهای شناسایی شده</p>
                  <p className="text-2xl font-bold text-blue-600">{mockMarketData.length}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">بازارهای فعال</p>
                  <p className="text-2xl font-bold text-green-600">
                    {mockMarketData.filter(m => m.status === 'active').length}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">  
                <div>
                  <p className="text-sm text-gray-600">درآمد تخمینی (USD)</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${(mockMarketData.reduce((sum, m) => sum + m.estimatedRevenue, 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">میانگین رشد بازار</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(mockMarketData.reduce((sum, m) => sum + m.growthRate, 0) / mockMarketData.length).toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="international-markets" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            بازارهای بین‌المللی
          </TabsTrigger>
          <TabsTrigger value="market-segments" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            بخش‌بندی بازار
          </TabsTrigger>
          <TabsTrigger value="competitor-analysis" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            تحلیل رقبا
          </TabsTrigger>
          <TabsTrigger value="market-intelligence" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            هوش بازار
          </TabsTrigger>
        </TabsList>

        <TabsContent value="international-markets" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="انتخاب منطقه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه مناطق</SelectItem>
                  {Object.entries(INTERNATIONAL_REGIONS).map(([key, region]) => (
                    <SelectItem key={key} value={key}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                فیلترهای پیشرفته
              </Button>
            </div>
            
            <Button onClick={() => setNewMarketDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              افزودن بازار جدید
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMarkets.map((market) => {
              const regionInfo = INTERNATIONAL_REGIONS[market.region];
              const priorityInfo = MARKET_PRIORITIES[market.priority];
              const statusInfo = MARKET_STATUS[market.status];
              
              return (
                <Card key={market.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center gap-2">
                          <Flag className="w-5 h-5 text-blue-600" />
                          {market.country}
                        </CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={regionInfo.color}>
                            {regionInfo.name}
                          </Badge>
                          <Badge className={priorityInfo.color}>
                            {priorityInfo.icon} {priorityInfo.name}
                          </Badge>
                          <Badge className={statusInfo.color}>
                            {React.createElement(statusInfo.icon, { className: "w-3 h-3 mr-1" })}
                            {statusInfo.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {}}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingMarket(market)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">اندازه بازار</p>
                          <p className="font-semibold text-green-600">
                            ${(market.marketSize / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">نرخ رشد</p>
                          <p className="font-semibold text-blue-600">{market.growthRate}%</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">مشتریان کلیدی:</p>
                        <div className="flex flex-wrap gap-1">
                          {market.keyCustomers.slice(0, 2).map((customer, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {customer}
                            </Badge>
                          ))}
                          {market.keyCustomers.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{market.keyCustomers.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">درآمد تخمینی:</p>
                        <p className="font-bold text-purple-600">
                          ${(market.estimatedRevenue / 1000000).toFixed(2)}M
                        </p>
                      </div>
                      
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        آخرین بروزرسانی: {new Date(market.lastUpdated).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="market-segments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">بخش‌بندی بازارهای هدف</h2>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              افزودن بخش جدید
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockSegmentData.map((segment) => (
              <Card key={segment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{segment.name}</span>
                    <Badge variant={segment.isActive ? "default" : "secondary"}>
                      {segment.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </CardTitle>
                  <p className="text-gray-600 text-sm">{segment.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">کشورهای هدف:</p>
                      <div className="flex flex-wrap gap-1">
                        {segment.targetCountries.map((country, index) => (
                          <Badge key={index} variant="outline">{country}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">دسته‌بندی محصولات:</p>
                      <div className="flex flex-wrap gap-1">
                        {segment.productCategories.map((category, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">اندازه بازار:</p>
                      <p className="text-lg font-bold text-green-600">
                        ${(segment.marketSize / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">پروفایل مشتری:</p>
                      <p className="text-sm text-gray-600">{segment.customerProfile}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="competitor-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تحلیل رقبای بین‌المللی</CardTitle>
              <p className="text-gray-600">بررسی و تحلیل رقبای اصلی در بازارهای هدف</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  تحلیل رقبا در حال توسعه
                </h3>
                <p className="text-gray-600 mb-4">
                  این بخش برای تحلیل جامع رقبای بین‌المللی طراحی شده است
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  شروع تحلیل رقبا
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market-intelligence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>هوش بازار و پیش‌بینی‌ها</CardTitle>
              <p className="text-gray-600">اطلاعات استراتژیک و تحلیل‌های پیش‌بینانه بازار</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  سیستم هوش بازار
                </h3>
                <p className="text-gray-600 mb-4">
                  ابزارهای پیشرفته تحلیل و پیش‌بینی روندهای بازار
                </p>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  فعال‌سازی هوش بازار
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add New Market Dialog */}
      <Dialog open={newMarketDialog} onOpenChange={setNewMarketDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>افزودن بازار جدید</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">فرم افزودن بازار جدید در حال طراحی است</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Market Dialog */}
      {editingMarket && (
        <Dialog open={!!editingMarket} onOpenChange={() => setEditingMarket(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ویرایش اطلاعات بازار: {editingMarket.country}</DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <Edit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">فرم ویرایش بازار در حال طراحی است</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MarketingModule;