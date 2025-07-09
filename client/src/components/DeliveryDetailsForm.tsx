import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Car, Bike, Truck, Package, Phone, MapPin, User } from 'lucide-react';

const deliveryDetailsSchema = z.object({
  deliveryMethod: z.string().min(1, "روش ارسال الزامی است"),
  logisticsNotes: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
  
  // Postal service details
  postalServiceName: z.string().optional(),
  postalTrackingCode: z.string().optional(),
  postalWeight: z.string().optional(),
  postalPrice: z.string().optional(),
  postalInsurance: z.boolean().optional(),
  
  // Vehicle details
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleColor: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  driverLicense: z.string().optional(),
  
  // Company details
  deliveryCompanyName: z.string().optional(),
  deliveryCompanyPhone: z.string().optional(),
  deliveryCompanyAddress: z.string().optional(),
});

type DeliveryDetailsFormData = z.infer<typeof deliveryDetailsSchema>;

interface DeliveryDetailsFormProps {
  customerDeliveryMethod: string;
  onSubmit: (data: DeliveryDetailsFormData) => void;
  isLoading?: boolean;
}

export default function DeliveryDetailsForm({ 
  customerDeliveryMethod, 
  onSubmit, 
  isLoading = false 
}: DeliveryDetailsFormProps) {
  const [selectedMethod, setSelectedMethod] = useState(customerDeliveryMethod || 'courier');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DeliveryDetailsFormData>({
    resolver: zodResolver(deliveryDetailsSchema),
    defaultValues: {
      deliveryMethod: customerDeliveryMethod || 'courier',
      postalInsurance: false,
    },
  });

  const deliveryMethod = watch('deliveryMethod');

  const handleFormSubmit = (data: DeliveryDetailsFormData) => {
    onSubmit(data);
  };

  const renderMethodIcon = (method: string) => {
    switch (method) {
      case 'post':
        return <Mail className="w-4 h-4" />;
      case 'courier':
        return <Bike className="w-4 h-4" />;
      case 'truck':
        return <Truck className="w-4 h-4" />;
      case 'personal_pickup':
        return <Package className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Delivery Method Selection */}
      <div className="space-y-2">
        <Label htmlFor="deliveryMethod">روش ارسال</Label>
        <Select 
          value={deliveryMethod} 
          onValueChange={(value) => {
            setValue('deliveryMethod', value);
            setSelectedMethod(value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="روش ارسال را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="post">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                ارسال پستی
              </div>
            </SelectItem>
            <SelectItem value="courier">
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4" />
                پیک موتوری
              </div>
            </SelectItem>
            <SelectItem value="truck">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                حمل با کامیون
              </div>
            </SelectItem>
            <SelectItem value="personal_pickup">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                تحویل حضوری
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.deliveryMethod && (
          <p className="text-sm text-red-600">{errors.deliveryMethod.message}</p>
        )}
      </div>

      {/* Method-specific Details */}
      <Tabs value={selectedMethod} className="w-full">
        {/* Postal Service Details */}
        <TabsContent value="post" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                اطلاعات پست
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalServiceName">نام شرکت پست</Label>
                  <Input
                    {...register('postalServiceName')}
                    placeholder="پست جمهوری اسلامی، پیشتاز، تیپاکس..."
                  />
                </div>
                <div>
                  <Label htmlFor="postalTrackingCode">کد رهگیری پستی</Label>
                  <Input
                    {...register('postalTrackingCode')}
                    placeholder="کد رهگیری"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalWeight">وزن (کیلوگرم)</Label>
                  <Input
                    {...register('postalWeight')}
                    type="number"
                    step="0.1"
                    placeholder="0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="postalPrice">هزینه پست (IQD)</Label>
                  <Input
                    {...register('postalPrice')}
                    type="number"
                    placeholder="25000"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="postalInsurance"
                  checked={watch('postalInsurance')}
                  onCheckedChange={(checked) => setValue('postalInsurance', checked as boolean)}
                />
                <Label htmlFor="postalInsurance">بیمه پستی</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courier Details */}
        <TabsContent value="courier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bike className="w-5 h-5" />
                اطلاعات پیک
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="driverName">نام راننده/پیک</Label>
                  <Input
                    {...register('driverName')}
                    placeholder="نام کامل راننده"
                  />
                </div>
                <div>
                  <Label htmlFor="driverPhone">شماره موبایل راننده</Label>
                  <Input
                    {...register('driverPhone')}
                    placeholder="07XX-XXX-XXXX"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleType">نوع وسیله نقلیه</Label>
                  <Select onValueChange={(value) => setValue('vehicleType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motorcycle">موتورسیکلت</SelectItem>
                      <SelectItem value="car">خودرو</SelectItem>
                      <SelectItem value="van">ون</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vehiclePlate">شماره پلاک</Label>
                  <Input
                    {...register('vehiclePlate')}
                    placeholder="XXX-YYY-ZZ"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleModel">مدل وسیله نقلیه</Label>
                  <Input
                    {...register('vehicleModel')}
                    placeholder="پراید، پیکان، هوندا..."
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleColor">رنگ وسیله نقلیه</Label>
                  <Input
                    {...register('vehicleColor')}
                    placeholder="سفید، آبی، قرمز..."
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="driverLicense">شماره گواهینامه</Label>
                <Input
                  {...register('driverLicense')}
                  placeholder="شماره گواهینامه راننده"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Truck Details */}
        <TabsContent value="truck" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                اطلاعات کامیون
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="deliveryCompanyName">نام شرکت حمل و نقل</Label>
                <Input
                  {...register('deliveryCompanyName')}
                  placeholder="نام شرکت حمل و نقل"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryCompanyPhone">تلفن شرکت</Label>
                  <Input
                    {...register('deliveryCompanyPhone')}
                    placeholder="07XX-XXX-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="driverName">نام راننده</Label>
                  <Input
                    {...register('driverName')}
                    placeholder="نام کامل راننده"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="driverPhone">شماره موبایل راننده</Label>
                  <Input
                    {...register('driverPhone')}
                    placeholder="07XX-XXX-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="vehiclePlate">شماره پلاک کامیون</Label>
                  <Input
                    {...register('vehiclePlate')}
                    placeholder="XXX-YYY-ZZ"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="deliveryCompanyAddress">آدرس شرکت</Label>
                <Textarea
                  {...register('deliveryCompanyAddress')}
                  placeholder="آدرس کامل شرکت حمل و نقل"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="driverLicense">شماره گواهینامه راننده</Label>
                <Input
                  {...register('driverLicense')}
                  placeholder="شماره گواهینامه راننده"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Pickup Details */}
        <TabsContent value="personal_pickup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                تحویل حضوری
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  مشتری شخصاً برای دریافت سفارش مراجعه خواهد کرد. 
                  لطفاً مشتری را از آماده بودن سفارش مطلع کنید.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Common Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="trackingNumber">کد رهگیری کلی</Label>
            <Input
              {...register('trackingNumber')}
              placeholder="کد رهگیری یکتا"
            />
          </div>
          <div>
            <Label htmlFor="estimatedDeliveryDate">تاریخ تحویل تقریبی</Label>
            <Input
              {...register('estimatedDeliveryDate')}
              type="date"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="logisticsNotes">یادداشت‌های بخش لجستیک</Label>
          <Textarea
            {...register('logisticsNotes')}
            placeholder="یادداشت‌ها و توضیحات اضافی..."
            rows={3}
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {isLoading ? 'در حال پردازش...' : 'تایید ارسال سفارش'}
      </Button>
    </form>
  );
}