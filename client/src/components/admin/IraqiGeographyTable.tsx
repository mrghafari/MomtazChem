import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Globe,
  Building,
  Users,
  Mountain,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';

interface IraqiCity {
  id: number;
  name: string;
  nameArabic: string;
  nameEnglish: string;
  nameKurdish?: string;
  provinceId: number;
  provinceName: string;
  region: string;
  postalCode?: string;
  distanceFromBaghdad?: number;
  distanceFromErbilKm?: number;
  distanceFromProvinceCapital?: number;
  isProvinceCapital: boolean;
  isActive: boolean;
  population?: number;
  coordinates?: string;
  elevation?: number;
  economicActivity?: string;
  notes?: string;
}

interface IraqiProvince {
  id: number;
  name: string;
  nameArabic: string;
  nameEnglish: string;
  nameKurdish?: string;
  capital: string;
  region: string;
  area?: number;
  population?: number;
  isActive: boolean;
}

type SortField = 'nameArabic' | 'nameEnglish' | 'provinceName' | 'region' | 'population' | 'distanceFromErbilKm' | 'elevation';
type SortDirection = 'asc' | 'desc';

const IraqiGeographyTable: React.FC = () => {
  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [isCapitalFilter, setIsCapitalFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('nameArabic');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentView, setCurrentView] = useState<'cities' | 'provinces'>('cities');

  // Fetch cities data
  const { data: citiesData, isLoading: citiesLoading, error: citiesError } = useQuery({
    queryKey: ['/api/iraqi-cities'],
  });

  // Fetch provinces data  
  const { data: provincesData, isLoading: provincesLoading, error: provincesError } = useQuery({
    queryKey: ['/api/iraqi-provinces'],
  });

  const cities: IraqiCity[] = citiesData?.data || [];
  const provinces: IraqiProvince[] = provincesData?.data || [];

  // Get unique regions for filter
  const uniqueRegions = useMemo(() => {
    const regions = [...new Set(cities.map(city => city.region).filter(Boolean))];
    return regions.sort();
  }, [cities]);

  // Get unique provinces for filter
  const uniqueProvinces = useMemo(() => {
    const provinceNames = [...new Set(cities.map(city => city.provinceName).filter(Boolean))];
    return provinceNames.sort();
  }, [cities]);

  // Filter and sort cities
  const filteredAndSortedCities = useMemo(() => {
    let filtered = cities.filter(city => {
      const matchesSearch = searchTerm === '' || 
        city.nameArabic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.nameEnglish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.nameKurdish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.provinceName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRegion = regionFilter === 'all' || city.region === regionFilter;
      const matchesProvince = provinceFilter === 'all' || city.provinceName === provinceFilter;
      const matchesCapital = isCapitalFilter === 'all' || 
        (isCapitalFilter === 'yes' && city.isProvinceCapital) ||
        (isCapitalFilter === 'no' && !city.isProvinceCapital);

      return matchesSearch && matchesRegion && matchesProvince && matchesCapital;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Convert to string for comparison if needed
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [cities, searchTerm, regionFilter, provinceFilter, isCapitalFilter, sortField, sortDirection]);

  // Filter and sort provinces
  const filteredAndSortedProvinces = useMemo(() => {
    let filtered = provinces.filter(province => {
      const matchesSearch = searchTerm === '' || 
        province.nameArabic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        province.nameEnglish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        province.nameKurdish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        province.capital?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRegion = regionFilter === 'all' || province.region === regionFilter;

      return matchesSearch && matchesRegion;
    });

    // Sort provinces
    filtered.sort((a, b) => {
      let aValue: any = a.nameArabic || '';
      let bValue: any = b.nameArabic || '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [provinces, searchTerm, regionFilter, sortDirection]);

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setRegionFilter('all');
    setProvinceFilter('all');
    setIsCapitalFilter('all');
    setSortField('nameArabic');
    setSortDirection('asc');
  };

  // Export data
  const exportData = () => {
    const dataToExport = currentView === 'cities' ? filteredAndSortedCities : filteredAndSortedProvinces;
    const csvContent = currentView === 'cities' 
      ? "نام عربی,نام انگلیسی,نام کردی,استان,منطقه,مرکز استان,جمعیت,فاصله از اربیل,ارتفاع\n" +
        dataToExport.map(city => 
          `"${city.nameArabic || ''}","${city.nameEnglish || ''}","${city.nameKurdish || ''}","${city.provinceName || ''}","${city.region || ''}","${city.isProvinceCapital ? 'بله' : 'خیر'}","${city.population || ''}","${city.distanceFromErbilKm || ''}","${city.elevation || ''}"`
        ).join('\n')
      : "نام عربی,نام انگلیسی,نام کردی,مرکز,منطقه,مساحت,جمعیت\n" +
        dataToExport.map(province => 
          `"${province.nameArabic || ''}","${province.nameEnglish || ''}","${province.nameKurdish || ''}","${province.capital || ''}","${province.region || ''}","${province.area || ''}","${province.population || ''}"`
        ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `iraqi-${currentView}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (citiesLoading || provincesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin ml-2" />
        <span>در حال بارگذاری داده‌های جغرافیایی...</span>
      </div>
    );
  }

  if (citiesError || provincesError) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">خطا در بارگذاری داده‌های جغرافیایی</div>
        <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Globe className="h-6 w-6 ml-2" />
              داده‌های جغرافیایی عراق
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'cities' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('cities')}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                شهرها ({cities.length})
              </Button>
              <Button
                variant={currentView === 'provinces' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('provinces')}
                className="flex items-center gap-2"
              >
                <Building className="h-4 w-4" />
                استان‌ها ({provinces.length})
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="h-5 w-5 ml-2" />
            فیلترها و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center">
                <Search className="h-4 w-4 ml-1" />
                جستجو
              </Label>
              <Input
                id="search"
                placeholder="نام شهر، استان یا منطقه..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Region Filter */}
            <div className="space-y-2">
              <Label>منطقه</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب منطقه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه مناطق</SelectItem>
                  {uniqueRegions.map(region => (
                    <SelectItem key={region} value={region}>
                      {region === 'north' ? 'شمال' :
                       region === 'south' ? 'جنوب' :
                       region === 'center' ? 'مرکز' :
                       region === 'kurdistan' ? 'کردستان' : region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Province Filter (Cities only) */}
            {currentView === 'cities' && (
              <div className="space-y-2">
                <Label>استان</Label>
                <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب استان" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه استان‌ها</SelectItem>
                    {uniqueProvinces.map(province => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Capital Filter (Cities only) */}
            {currentView === 'cities' && (
              <div className="space-y-2">
                <Label>مرکز استان</Label>
                <Select value={isCapitalFilter} onValueChange={setIsCapitalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه شهرها</SelectItem>
                    <SelectItem value="yes">مراکز استان</SelectItem>
                    <SelectItem value="no">سایر شهرها</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                بازنشانی فیلترها
              </Button>
              <Button variant="outline" size="sm" onClick={exportData} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                دانلود CSV
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              نمایش {currentView === 'cities' ? filteredAndSortedCities.length : filteredAndSortedProvinces.length} 
              از {currentView === 'cities' ? cities.length : provinces.length} مورد
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cities Table */}
      {currentView === 'cities' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 ml-2" />
              شهرهای عراق
              <Badge variant="secondary" className="mr-2">
                {filteredAndSortedCities.length} شهر
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('nameArabic')} className="flex items-center">
                        نام عربی {getSortIcon('nameArabic')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('nameEnglish')} className="flex items-center">
                        نام انگلیسی {getSortIcon('nameEnglish')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">نام کردی</TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('provinceName')} className="flex items-center">
                        استان {getSortIcon('provinceName')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('region')} className="flex items-center">
                        منطقه {getSortIcon('region')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">مرکز استان</TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('population')} className="flex items-center">
                        جمعیت {getSortIcon('population')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('distanceFromErbilKm')} className="flex items-center">
                        فاصله از اربیل {getSortIcon('distanceFromErbilKm')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('elevation')} className="flex items-center">
                        ارتفاع (متر) {getSortIcon('elevation')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">کد پستی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        هیچ شهری با این فیلترها یافت نشد
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedCities.map((city) => (
                      <TableRow key={city.id}>
                        <TableCell className="font-medium">{city.nameArabic || '-'}</TableCell>
                        <TableCell>{city.nameEnglish || '-'}</TableCell>
                        <TableCell>{city.nameKurdish || '-'}</TableCell>
                        <TableCell>{city.provinceName}</TableCell>
                        <TableCell>
                          <Badge variant={
                            city.region === 'north' ? 'default' :
                            city.region === 'center' ? 'secondary' :
                            city.region === 'south' ? 'outline' :
                            city.region === 'kurdistan' ? 'destructive' : 'default'
                          }>
                            {city.region === 'north' ? 'شمال' :
                             city.region === 'center' ? 'مرکز' :
                             city.region === 'south' ? 'جنوب' :
                             city.region === 'kurdistan' ? 'کردستان' : city.region}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {city.isProvinceCapital ? (
                            <Badge variant="default" className="text-xs">مرکز استان</Badge>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {city.population ? city.population.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {city.distanceFromErbilKm ? `${city.distanceFromErbilKm} کیلومتر` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {city.elevation && <Mountain className="h-3 w-3 text-gray-500" />}
                            {city.elevation || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{city.postalCode || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provinces Table */}
      {currentView === 'provinces' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 ml-2" />
              استان‌های عراق
              <Badge variant="secondary" className="mr-2">
                {filteredAndSortedProvinces.length} استان
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام عربی</TableHead>
                    <TableHead className="text-right">نام انگلیسی</TableHead>
                    <TableHead className="text-right">نام کردی</TableHead>
                    <TableHead className="text-right">مرکز</TableHead>
                    <TableHead className="text-right">منطقه</TableHead>
                    <TableHead className="text-right">مساحت (کیلومتر مربع)</TableHead>
                    <TableHead className="text-right">جمعیت</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProvinces.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        هیچ استانی با این فیلترها یافت نشد
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedProvinces.map((province) => (
                      <TableRow key={province.id}>
                        <TableCell className="font-medium">{province.nameArabic || '-'}</TableCell>
                        <TableCell>{province.nameEnglish || '-'}</TableCell>
                        <TableCell>{province.nameKurdish || '-'}</TableCell>
                        <TableCell>{province.capital || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            province.region === 'north' ? 'default' :
                            province.region === 'center' ? 'secondary' :
                            province.region === 'south' ? 'outline' :
                            province.region === 'kurdistan' ? 'destructive' : 'default'
                          }>
                            {province.region === 'north' ? 'شمال' :
                             province.region === 'center' ? 'مرکز' :
                             province.region === 'south' ? 'جنوب' :
                             province.region === 'kurdistan' ? 'کردستان' : province.region}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {province.area ? province.area.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-500" />
                            {province.population ? province.population.toLocaleString() : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={province.isActive ? 'default' : 'destructive'}>
                            {province.isActive ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IraqiGeographyTable;