import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Edit, Plus, Save, X, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Province {
  id: number;
  nameEnglish: string;
  nameArabic: string;
  name: string;
  distanceFromErbilKm: number;
}

interface City {
  id: number;
  nameEnglish: string;
  nameArabic: string;
  name: string;
  provinceId: number;
  distanceFromErbilKm: number;
  provinceName?: string;
}

export default function LogisticsGeography() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingProvince, setEditingProvince] = useState<Province | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [showProvinceDialog, setShowProvinceDialog] = useState(false);
  const [showCityDialog, setShowCityDialog] = useState(false);

  // Fetch provinces
  const { data: provincesData, isLoading: provincesLoading } = useQuery({
    queryKey: ["/api/iraqi-provinces"],
    retry: 1,
  });

  // Fetch cities
  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/iraqi-cities"],
    retry: 1,
  });

  const provinces = (provincesData?.data || []) as Province[];
  const cities = (citiesData?.data || []) as City[];

  // Add province names to cities for display
  const citiesWithProvinces = cities.map(city => ({
    ...city,
    provinceName: provinces.find(p => p.id === city.provinceId)?.nameEnglish || 'Unknown'
  }));

  // Update province mutation
  const updateProvinceMutation = useMutation({
    mutationFn: async (data: Province) => {
      return apiRequest('/api/admin/iraqi-provinces/' + data.id, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "استان با موفقیت به‌روزرسانی شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/iraqi-provinces"] });
      setShowProvinceDialog(false);
      setEditingProvince(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "به‌روزرسانی استان ناموفق بود",
      });
    }
  });

  // Update city mutation
  const updateCityMutation = useMutation({
    mutationFn: async (data: City) => {
      return apiRequest('/api/admin/iraqi-cities/' + data.id, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "شهر با موفقیت به‌روزرسانی شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/iraqi-cities"] });
      setShowCityDialog(false);
      setEditingCity(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "به‌روزرسانی شهر ناموفق بود",
      });
    }
  });

  const handleEditProvince = (province: Province) => {
    setEditingProvince(province);
    setShowProvinceDialog(true);
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setShowCityDialog(true);
  };

  const handleSaveProvince = () => {
    if (editingProvince) {
      updateProvinceMutation.mutate(editingProvince);
    }
  };

  const handleSaveCity = () => {
    if (editingCity) {
      updateCityMutation.mutate(editingCity);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-600" />
            مدیریت جغرافیای لجستیک
          </h1>
          <p className="text-gray-600 mt-2">
            مدیریت استان‌ها و شهرهای عراق با فاصله از اربیل برای محاسبات لجستیک
          </p>
        </div>

        <Tabs defaultValue="provinces" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="provinces">
              مدیریت استان‌ها ({provinces.length})
            </TabsTrigger>
            <TabsTrigger value="cities">
              مدیریت شهرها ({cities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="provinces">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  استان‌های عراق
                </CardTitle>
                <CardDescription>
                  مدیریت 18 استان عراق با فاصله از اربیل برای محاسبات لجستیک
                </CardDescription>
              </CardHeader>
              <CardContent>
                {provincesLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">شناسه</TableHead>
                          <TableHead className="text-right">نام فارسی/عربی</TableHead>
                          <TableHead className="text-right">نام انگلیسی</TableHead>
                          <TableHead className="text-right">فاصله از اربیل (کیلومتر)</TableHead>
                          <TableHead className="text-right">عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {provinces.map((province) => (
                          <TableRow key={province.id}>
                            <TableCell className="font-medium">{province.id}</TableCell>
                            <TableCell>{province.nameArabic || province.name}</TableCell>
                            <TableCell>{province.nameEnglish}</TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {province.distanceFromErbilKm} کیلومتر
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProvince(province)}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                ویرایش
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  شهرهای عراق
                </CardTitle>
                <CardDescription>
                  مدیریت 188 شهر عراق با فاصله از اربیل برای محاسبات لجستیک
                </CardDescription>
              </CardHeader>
              <CardContent>
                {citiesLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">شناسه</TableHead>
                          <TableHead className="text-right">نام فارسی/عربی</TableHead>
                          <TableHead className="text-right">نام انگلیسی</TableHead>
                          <TableHead className="text-right">استان</TableHead>
                          <TableHead className="text-right">فاصله از اربیل (کیلومتر)</TableHead>
                          <TableHead className="text-right">عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {citiesWithProvinces.map((city) => (
                          <TableRow key={city.id}>
                            <TableCell className="font-medium">{city.id}</TableCell>
                            <TableCell>{city.nameArabic || city.name}</TableCell>
                            <TableCell>{city.nameEnglish}</TableCell>
                            <TableCell>{city.provinceName}</TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {city.distanceFromErbilKm} کیلومتر
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCity(city)}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                ویرایش
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Province Edit Dialog */}
        <Dialog open={showProvinceDialog} onOpenChange={setShowProvinceDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ویرایش استان</DialogTitle>
              <DialogDescription>
                ویرایش اطلاعات استان و فاصله آن از اربیل
              </DialogDescription>
            </DialogHeader>
            {editingProvince && (
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="provinceName">نام فارسی/عربی</Label>
                  <Input
                    id="provinceName"
                    value={editingProvince.nameArabic || editingProvince.name}
                    onChange={(e) => setEditingProvince({
                      ...editingProvince,
                      nameArabic: e.target.value,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="provinceNameEn">نام انگلیسی</Label>
                  <Input
                    id="provinceNameEn"
                    value={editingProvince.nameEnglish}
                    onChange={(e) => setEditingProvince({
                      ...editingProvince,
                      nameEnglish: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="provinceDistance">فاصله از اربیل (کیلومتر)</Label>
                  <Input
                    id="provinceDistance"
                    type="number"
                    value={editingProvince.distanceFromErbilKm}
                    onChange={(e) => setEditingProvince({
                      ...editingProvince,
                      distanceFromErbilKm: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowProvinceDialog(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    لغو
                  </Button>
                  <Button
                    onClick={handleSaveProvince}
                    disabled={updateProvinceMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    ذخیره
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* City Edit Dialog */}
        <Dialog open={showCityDialog} onOpenChange={setShowCityDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ویرایش شهر</DialogTitle>
              <DialogDescription>
                ویرایش اطلاعات شهر و فاصله آن از اربیل
              </DialogDescription>
            </DialogHeader>
            {editingCity && (
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="cityName">نام فارسی/عربی</Label>
                  <Input
                    id="cityName"
                    value={editingCity.nameArabic || editingCity.name}
                    onChange={(e) => setEditingCity({
                      ...editingCity,
                      nameArabic: e.target.value,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="cityNameEn">نام انگلیسی</Label>
                  <Input
                    id="cityNameEn"
                    value={editingCity.nameEnglish}
                    onChange={(e) => setEditingCity({
                      ...editingCity,
                      nameEnglish: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="cityDistance">فاصله از اربیل (کیلومتر)</Label>
                  <Input
                    id="cityDistance"
                    type="number"
                    value={editingCity.distanceFromErbilKm}
                    onChange={(e) => setEditingCity({
                      ...editingCity,
                      distanceFromErbilKm: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCityDialog(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    لغو
                  </Button>
                  <Button
                    onClick={handleSaveCity}
                    disabled={updateCityMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    ذخیره
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}