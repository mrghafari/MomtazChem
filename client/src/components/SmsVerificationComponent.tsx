import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Shield, Clock, CheckCircle, AlertCircle, Send, Phone } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SmsVerificationProps {
  orderId: number;
  orderPhone?: string;
  customerName?: string;
  smsEnabled?: boolean;
}

interface VerificationHistory {
  id: number;
  verificationCode: string;
  smsSent: boolean;
  smsDelivered: boolean;
  isUsed: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  deliveryAttempts: number;
  createdAt: string;
}

export default function SmsVerificationComponent({ orderId, orderPhone, customerName, smsEnabled = true }: SmsVerificationProps) {
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [courierName, setCourierName] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate SMS verification code
  const generateSmsCodeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/logistics/orders/${orderId}/generate-sms-code`, 'POST', {});
    },
    onSuccess: (data) => {
      toast({
        title: "موفق",
        description: `کد تأیید تولید شد: ${data.verificationCode}`,
      });
      if (data.smsSent) {
        toast({
          title: "پیامک ارسال شد",
          description: "کد تأیید برای مشتری ارسال شد",
          variant: "default",
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/logistics/orders/${orderId}/verification-history`] });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در تولید کد تأیید",
        variant: "destructive",
      });
    },
  });

  // Verify delivery code
  const verifyDeliveryMutation = useMutation({
    mutationFn: async (data: { verificationCode: string; customerOrderId: number; courierName: string; verificationNotes?: string }) => {
      return apiRequest('/api/logistics/verify-delivery', 'POST', data);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "موفق",
          description: "کد تأیید با موفقیت تأیید شد",
        });
        setVerifyDialogOpen(false);
        setVerificationCode('');
        setCourierName('');
        setVerificationNotes('');
        queryClient.invalidateQueries({ queryKey: [`/api/logistics/orders/${orderId}/verification-history`] });
        queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics'] });
      } else {
        toast({
          title: "خطا",
          description: data.message || "کد تأیید نامعتبر است",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در تأیید کد تحویل",
        variant: "destructive",
      });
    },
  });

  // Increment delivery attempts
  const incrementAttemptsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/logistics/orders/${orderId}/increment-attempts`, 'POST', {});
    },
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "تلاش تحویل ثبت شد",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/logistics/orders/${orderId}/verification-history`] });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ثبت تلاش تحویل",
        variant: "destructive",
      });
    },
  });

  // Get verification history
  const { data: historyData } = useQuery({
    queryKey: [`/api/logistics/orders/${orderId}/verification-history`],
    queryFn: () => apiRequest(`/api/logistics/orders/${orderId}/verification-history`),
    enabled: smsEnabled,
  });

  if (!smsEnabled) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <MessageSquare className="h-4 w-4" />
            <span>تأیید پیامکی غیرفعال است</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const history = historyData?.history || [];
  const activeCode = history.find((h: VerificationHistory) => h.isUsed === false);
  const verifiedCode = history.find((h: VerificationHistory) => h.isUsed === true);

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          تأیید پیامکی تحویل
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Customer Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-4 w-4" />
          <span>{customerName || 'مشتری'}</span>
          <span>•</span>
          <span>{orderPhone || 'شماره تماس ثبت نشده'}</span>
        </div>

        {/* Current Status */}
        {verifiedCode ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-green-800">تحویل تأیید شده</div>
              <div className="text-sm text-green-600">
                کد: {verifiedCode.verificationCode} • تأیید شده توسط: {verifiedCode.verifiedBy}
              </div>
              <div className="text-xs text-green-500">
                {new Date(verifiedCode.verifiedAt!).toLocaleString('fa-IR')}
              </div>
            </div>
          </div>
        ) : activeCode ? (
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <div className="font-medium text-orange-800">کد تأیید فعال</div>
              <div className="text-sm text-orange-600">
                کد: {activeCode.verificationCode} • تلاش‌های تحویل: {activeCode.deliveryAttempts}
              </div>
              <div className="text-xs text-orange-500">
                ارسال شده: {new Date(activeCode.createdAt).toLocaleString('fa-IR')}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-800">کد تأیید موجود نیست</div>
              <div className="text-sm text-gray-600">برای تحویل، ابتدا کد تأیید تولید کنید</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!verifiedCode && (
            <>
              <Button 
                onClick={() => generateSmsCodeMutation.mutate()}
                disabled={generateSmsCodeMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {activeCode ? 'ارسال مجدد کد' : 'تولید کد تأیید'}
              </Button>

              {activeCode && (
                <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      تأیید تحویل
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>تأیید تحویل سفارش</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="verificationCode">کد تأیید (4 رقم)</Label>
                        <Input
                          id="verificationCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="کد تأیید را وارد کنید"
                          maxLength={4}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="courierName">نام پیک/تحویل‌دهنده</Label>
                        <Input
                          id="courierName"
                          value={courierName}
                          onChange={(e) => setCourierName(e.target.value)}
                          placeholder="نام تحویل‌دهنده"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="verificationNotes">توضیحات (اختیاری)</Label>
                        <Textarea
                          id="verificationNotes"
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="توضیحات تحویل"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => verifyDeliveryMutation.mutate({
                            verificationCode,
                            customerOrderId: orderId,
                            courierName,
                            verificationNotes
                          })}
                          disabled={verifyDeliveryMutation.isPending || !verificationCode.trim() || !courierName.trim()}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          تأیید نهایی
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setVerifyDialogOpen(false)}
                        >
                          انصراف
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Button 
                variant="outline" 
                onClick={() => incrementAttemptsMutation.mutate()}
                disabled={incrementAttemptsMutation.isPending}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                ثبت تلاش ناموفق
              </Button>
            </>
          )}
        </div>

        {/* Verification History */}
        {history.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">تاریخچه تأیید</h4>
            <div className="space-y-2">
              {history.map((item: VerificationHistory) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <Badge variant="outline" className="mr-2">
                      {item.verificationCode}
                    </Badge>
                    <span className="text-gray-600">
                      {new Date(item.createdAt).toLocaleString('fa-IR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.smsSent && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600">پیامک شد</Badge>
                    )}
                    {item.isUsed && (
                      <Badge variant="outline" className="bg-green-50 text-green-600">تأیید شده</Badge>
                    )}
                    {item.deliveryAttempts > 0 && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-600">
                        {item.deliveryAttempts} تلاش
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}