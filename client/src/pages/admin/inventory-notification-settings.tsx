import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Settings, 
  Bell,
  Users,
  AlertTriangle,
  CheckCircle,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface NotificationContact {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  receiveEmails: boolean;
  receiveSMS: boolean;
  isEmergencyContact: boolean;
  alertTypes: string[];
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  managerEmail: string;
  managerPhone: string;
  checkIntervalHours: number;
  businessHoursOnly: boolean;
  businessStartHour: number;
  businessEndHour: number;
  emergencyThreshold: number;
  contacts: NotificationContact[];
}

export default function InventoryNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: true,
    managerEmail: 'info@momtazchem.com',
    managerPhone: '+964xxxxxxxxx',
    checkIntervalHours: 1,
    businessHoursOnly: true,
    businessStartHour: 8,
    businessEndHour: 18,
    emergencyThreshold: 0,
    contacts: []
  });

  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    receiveEmails: true,
    receiveSMS: false,
    isEmergencyContact: false,
    alertTypes: ['low_stock', 'out_of_stock']
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["/api/inventory/notification-settings"],
    onSuccess: (data) => {
      if (data) {
        setSettings(data);
      }
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data: NotificationSettings) => 
      apiRequest("/api/inventory/notification-settings", "POST", data),
    onSuccess: () => {
      toast({
        title: "تنظیمات ذخیره شد",
        description: "تنظیمات اطلاع‌رسانی موجودی با موفقیت به‌روزرسانی شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/notification-settings"] });
    },
    onError: () => {
      toast({
        title: "خطا در ذخیره‌سازی",
        description: "خطایی در ذخیره تنظیمات رخ داد",
        variant: "destructive",
      });
    }
  });

  const testNotificationMutation = useMutation({
    mutationFn: (type: 'email' | 'sms') => 
      apiRequest(`/api/inventory/test-notification/${type}`, "POST"),
    onSuccess: (_, type) => {
      toast({
        title: "تست موفق",
        description: `تست ${type === 'email' ? 'ایمیل' : 'پیامک'} با موفقیت ارسال شد`,
      });
    },
    onError: () => {
      toast({
        title: "خطا در تست",
        description: "خطایی در ارسال تست رخ داد",
        variant: "destructive",
      });
    }
  });

  const addContact = () => {
    if (!newContact.name || !newContact.email) {
      toast({
        title: "خطا",
        description: "نام و ایمیل الزامی است",
        variant: "destructive",
      });
      return;
    }

    const contact: NotificationContact = {
      id: Date.now(),
      ...newContact
    };

    setSettings(prev => ({
      ...prev,
      contacts: [...prev.contacts, contact]
    }));

    setNewContact({
      name: '',
      email: '',
      phone: '',
      role: '',
      receiveEmails: true,
      receiveSMS: false,
      isEmergencyContact: false,
      alertTypes: ['low_stock', 'out_of_stock']
    });
  };

  const removeContact = (id: number) => {
    setSettings(prev => ({
      ...prev,
      contacts: prev.contacts.filter(c => c.id !== id)
    }));
  };

  const updateContact = (id: number, updates: Partial<NotificationContact>) => {
    setSettings(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">تنظیمات اطلاع‌رسانی موجودی</h1>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تنظیمات اطلاع‌رسانی موجودی</h1>
          <p className="text-gray-600 mt-1">مدیریت هشدارهای موجودی، مخاطبین و روش‌های اطلاع‌رسانی</p>
        </div>
        
        <Button 
          onClick={() => saveSettingsMutation.mutate(settings)}
          disabled={saveSettingsMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {saveSettingsMutation.isPending ? (
            <>
              <Settings className="w-4 h-4 mr-2 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              ذخیره تنظیمات
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">تنظیمات کلی</TabsTrigger>
          <TabsTrigger value="contacts">مخاطبین</TabsTrigger>
          <TabsTrigger value="schedule">زمان‌بندی</TabsTrigger>
          <TabsTrigger value="test">تست سیستم</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                تنظیمات اصلی اطلاع‌رسانی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">اطلاع‌رسانی ایمیل</Label>
                    <p className="text-sm text-gray-500">ارسال هشدارها از طریق ایمیل</p>
                  </div>
                  <Switch
                    checked={settings.emailEnabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, emailEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">اطلاع‌رسانی پیامک</Label>
                    <p className="text-sm text-gray-500">ارسال هشدارها از طریق SMS</p>
                  </div>
                  <Switch
                    checked={settings.smsEnabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, smsEnabled: checked }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="managerEmail">ایمیل مدیر اصلی</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={settings.managerEmail}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, managerEmail: e.target.value }))
                    }
                    placeholder="manager@momtazchem.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerPhone">شماره تلفن مدیر</Label>
                  <Input
                    id="managerPhone"
                    type="tel"
                    value={settings.managerPhone}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, managerPhone: e.target.value }))
                    }
                    placeholder="+964xxxxxxxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyThreshold">آستانه اضطراری (تعداد محصولات تمام شده)</Label>
                <Input
                  id="emergencyThreshold"
                  type="number"
                  min="0"
                  value={settings.emergencyThreshold}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, emergencyThreshold: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0"
                />
                <p className="text-sm text-gray-500">
                  اگر تعداد محصولات تمام شده از این عدد بیشتر شود، هشدار اضطراری ارسال می‌شود
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                مخاطبین اطلاع‌رسانی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Contact Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium mb-4">افزودن مخاطب جدید</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="نام و نام خانوادگی"
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="سمت"
                    value={newContact.role}
                    onChange={(e) => setNewContact(prev => ({ ...prev, role: e.target.value }))}
                  />
                  <Input
                    type="email"
                    placeholder="ایمیل"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    type="tel"
                    placeholder="شماره تلفن"
                    value={newContact.phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newContact.receiveEmails}
                      onCheckedChange={(checked) => 
                        setNewContact(prev => ({ ...prev, receiveEmails: checked }))
                      }
                    />
                    <Label>ایمیل</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newContact.receiveSMS}
                      onCheckedChange={(checked) => 
                        setNewContact(prev => ({ ...prev, receiveSMS: checked }))
                      }
                    />
                    <Label>پیامک</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newContact.isEmergencyContact}
                      onCheckedChange={(checked) => 
                        setNewContact(prev => ({ ...prev, isEmergencyContact: checked }))
                      }
                    />
                    <Label>اضطراری</Label>
                  </div>
                </div>

                <Button onClick={addContact} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  افزودن مخاطب
                </Button>
              </div>

              {/* Contacts List */}
              <div className="space-y-3">
                {settings.contacts.map((contact) => (
                  <Card key={contact.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{contact.name}</h4>
                            {contact.role && <Badge variant="outline">{contact.role}</Badge>}
                            {contact.isEmergencyContact && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                اضطراری
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {contact.email}
                              </span>
                              {contact.phone && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {contact.phone}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {contact.receiveEmails && <Badge variant="secondary" className="text-xs">ایمیل</Badge>}
                              {contact.receiveSMS && <Badge variant="secondary" className="text-xs">پیامک</Badge>}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContact(contact.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {settings.contacts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    هنوز مخاطبی اضافه نشده است
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                زمان‌بندی بررسی موجودی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="checkInterval">فاصله بررسی (ساعت)</Label>
                  <Input
                    id="checkInterval"
                    type="number"
                    min="1"
                    max="24"
                    value={settings.checkIntervalHours}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, checkIntervalHours: parseInt(e.target.value) || 1 }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">فقط در ساعات کاری</Label>
                    <p className="text-sm text-gray-500">بررسی فقط در ساعات کاری انجام شود</p>
                  </div>
                  <Switch
                    checked={settings.businessHoursOnly}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, businessHoursOnly: checked }))
                    }
                  />
                </div>
              </div>

              {settings.businessHoursOnly && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startHour">شروع ساعات کاری</Label>
                    <Input
                      id="startHour"
                      type="number"
                      min="0"
                      max="23"
                      value={settings.businessStartHour}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, businessStartHour: parseInt(e.target.value) || 8 }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endHour">پایان ساعات کاری</Label>
                    <Input
                      id="endHour"
                      type="number"
                      min="0"
                      max="23"
                      value={settings.businessEndHour}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, businessEndHour: parseInt(e.target.value) || 18 }))
                      }
                    />
                  </div>
                </div>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  سیستم بر اساس تنظیمات فوق هر {settings.checkIntervalHours} ساعت یکبار موجودی را بررسی می‌کند
                  {settings.businessHoursOnly && ` و فقط از ساعت ${settings.businessStartHour} تا ${settings.businessEndHour} فعال است`}.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                تست سیستم اطلاع‌رسانی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => testNotificationMutation.mutate('email')}
                  disabled={testNotificationMutation.isPending || !settings.emailEnabled}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Mail className="w-6 h-6 mb-2" />
                  <span>تست ایمیل</span>
                </Button>

                <Button 
                  onClick={() => testNotificationMutation.mutate('sms')}
                  disabled={testNotificationMutation.isPending || !settings.smsEnabled}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <MessageSquare className="w-6 h-6 mb-2" />
                  <span>تست پیامک</span>
                </Button>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  با کلیک روی دکمه‌های بالا می‌توانید سیستم اطلاع‌رسانی را آزمایش کنید. 
                  پیام تستی به مخاطبین تعریف شده ارسال خواهد شد.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">خلاصه تنظیمات فعلی:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• ایمیل: {settings.emailEnabled ? '✅ فعال' : '❌ غیرفعال'}</li>
                  <li>• پیامک: {settings.smsEnabled ? '✅ فعال' : '❌ غیرفعال'}</li>
                  <li>• مخاطبین: {settings.contacts.length} نفر</li>
                  <li>• بررسی هر {settings.checkIntervalHours} ساعت</li>
                  <li>• ساعات کاری: {settings.businessHoursOnly ? `${settings.businessStartHour}:00 - ${settings.businessEndHour}:00` : 'همیشه'}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}