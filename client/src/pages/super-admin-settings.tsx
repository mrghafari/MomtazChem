import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Shield, Mail, Phone, Key, UserPlus, Trash2, CheckCircle, XCircle } from "lucide-react";

interface SuperAdmin {
  id: number;
  username: string;
  email: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface PendingVerification {
  id: number;
  email: string;
  phone?: string;
  verificationCode: string;
  type: 'email' | 'sms';
  expiresAt: string;
  createdAt: string;
}

export default function SuperAdminSettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [resetEmailData, setResetEmailData] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [verificationData, setVerificationData] = useState({
    adminId: 0,
    type: 'email' as 'email' | 'sms',
    code: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch super admins
  const { data: superAdmins = [], isLoading: loadingAdmins } = useQuery({
    queryKey: ['/api/super-admin/admins'],
  });

  // Fetch pending verifications
  const { data: pendingVerifications = [], isLoading: loadingVerifications } = useQuery({
    queryKey: ['/api/super-admin/pending-verifications'],
  });

  // Create new super admin
  const createAdminMutation = useMutation({
    mutationFn: async (data: typeof newAdminData) => {
      return await apiRequest('/api/super-admin/create', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response) => {
      toast({
        title: "ایجاد سوپر ادمین",
        description: response.message || "سوپر ادمین جدید ایجاد شد. کد تایید ایمیل ارسال شد.",
      });
      setNewAdminData({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/pending-verifications'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ایجاد سوپر ادمین",
        variant: "destructive"
      });
    }
  });

  // Send verification code
  const sendVerificationMutation = useMutation({
    mutationFn: async ({ adminId, type }: { adminId: number, type: 'email' | 'sms' }) => {
      return await apiRequest('/api/super-admin/send-verification', {
        method: 'POST',
        body: JSON.stringify({ adminId, type })
      });
    },
    onSuccess: (response) => {
      toast({
        title: "ارسال کد تایید",
        description: response.message || "کد تایید ارسال شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ارسال کد تایید",
        variant: "destructive"
      });
    }
  });

  // Verify code
  const verifyCodeMutation = useMutation({
    mutationFn: async (data: typeof verificationData) => {
      return await apiRequest('/api/super-admin/verify', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response) => {
      toast({
        title: "تایید موفق",
        description: response.message || "حساب کاربری با موفقیت تایید شد",
      });
      setVerificationData({ adminId: 0, type: 'email', code: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/pending-verifications'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "کد تایید نامعتبر است",
        variant: "destructive"
      });
    }
  });

  // Password reset request
  const passwordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest('/api/super-admin/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },
    onSuccess: (response) => {
      toast({
        title: "ارسال کد بازیابی",
        description: response.message || "کد بازیابی رمز عبور به ایمیل شما ارسال شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ارسال کد بازیابی",
        variant: "destructive"
      });
    }
  });

  // Reset password with code
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: typeof resetEmailData) => {
      return await apiRequest('/api/super-admin/reset-password', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response) => {
      toast({
        title: "تغییر رمز عبور",
        description: response.message || "رمز عبور با موفقیت تغییر کرد",
      });
      setResetEmailData({
        email: '',
        verificationCode: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در تغییر رمز عبور",
        variant: "destructive"
      });
    }
  });

  // Delete super admin
  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: number) => {
      return await apiRequest(`/api/super-admin/admins/${adminId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (response) => {
      toast({
        title: "حذف سوپر ادمین",
        description: response.message || "سوپر ادمین حذف شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در حذف سوپر ادمین",
        variant: "destructive"
      });
    }
  });

  const handleCreateAdmin = () => {
    if (newAdminData.password !== newAdminData.confirmPassword) {
      toast({
        title: "خطا",
        description: "رمز عبور و تایید رمز عبور یکسان نیستند",
        variant: "destructive"
      });
      return;
    }
    if (newAdminData.password.length < 6) {
      toast({
        title: "خطا",
        description: "رمز عبور باید حداقل 6 کاراکتر باشد",
        variant: "destructive"
      });
      return;
    }
    createAdminMutation.mutate(newAdminData);
  };

  const handleResetPassword = () => {
    if (resetEmailData.newPassword !== resetEmailData.confirmNewPassword) {
      toast({
        title: "خطا",
        description: "رمز عبور جدید و تایید آن یکسان نیستند",
        variant: "destructive"
      });
      return;
    }
    if (resetEmailData.newPassword.length < 6) {
      toast({
        title: "خطا",
        description: "رمز عبور باید حداقل 6 کاراکتر باشد",
        variant: "destructive"
      });
      return;
    }
    resetPasswordMutation.mutate(resetEmailData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            مدیریت سوپر ادمین
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            ایجاد، مدیریت و تایید حساب‌های سوپر ادمین
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">ایجاد سوپر ادمین</TabsTrigger>
            <TabsTrigger value="manage">مدیریت ادمین‌ها</TabsTrigger>
            <TabsTrigger value="verify">تایید حساب</TabsTrigger>
            <TabsTrigger value="reset">بازیابی رمز</TabsTrigger>
          </TabsList>

          {/* Create Super Admin */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  ایجاد سوپر ادمین جدید
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">نام کاربری</Label>
                    <Input
                      id="username"
                      value={newAdminData.username}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="نام کاربری را وارد کنید"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">ایمیل</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="آدرس ایمیل را وارد کنید"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">شماره تلفن (اختیاری)</Label>
                    <Input
                      id="phone"
                      value={newAdminData.phone}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="شماره تلفن را وارد کنید"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">رمز عبور</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newAdminData.password}
                        onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="رمز عبور را وارد کنید"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="confirmPassword">تایید رمز عبور</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={newAdminData.confirmPassword}
                        onChange={(e) => setNewAdminData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="رمز عبور را مجدداً وارد کنید"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateAdmin}
                  disabled={createAdminMutation.isPending || !newAdminData.username || !newAdminData.email || !newAdminData.password}
                  className="w-full"
                >
                  {createAdminMutation.isPending ? "در حال ایجاد..." : "ایجاد سوپر ادمین"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Super Admins */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>لیست سوپر ادمین‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdmins ? (
                  <div className="text-center py-8">در حال بارگذاری...</div>
                ) : (
                  <div className="space-y-4">
                    {superAdmins.map((admin: SuperAdmin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{admin.username}</h3>
                            <Badge variant={admin.isActive ? "default" : "secondary"}>
                              {admin.isActive ? "فعال" : "غیرفعال"}
                            </Badge>
                            {admin.emailVerified && (
                              <Badge variant="outline" className="text-green-600">
                                <Mail className="h-3 w-3 mr-1" />
                                ایمیل تایید شده
                              </Badge>
                            )}
                            {admin.phoneVerified && (
                              <Badge variant="outline" className="text-blue-600">
                                <Phone className="h-3 w-3 mr-1" />
                                تلفن تایید شده
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{admin.email}</p>
                          {admin.phone && (
                            <p className="text-sm text-slate-600">{admin.phone}</p>
                          )}
                          {admin.lastLoginAt && (
                            <p className="text-xs text-slate-500 mt-1">
                              آخرین ورود: {new Date(admin.lastLoginAt).toLocaleDateString('fa-IR')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!admin.emailVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendVerificationMutation.mutate({ adminId: admin.id, type: 'email' })}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              تایید ایمیل
                            </Button>
                          )}
                          {admin.phone && !admin.phoneVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendVerificationMutation.mutate({ adminId: admin.id, type: 'sms' })}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              تایید تلفن
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteAdminMutation.mutate(admin.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verify Account */}
          <TabsContent value="verify">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>تایید حساب کاربری</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="adminSelect">انتخاب ادمین</Label>
                    <select
                      id="adminSelect"
                      className="w-full p-2 border rounded-md"
                      value={verificationData.adminId}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, adminId: parseInt(e.target.value) }))}
                    >
                      <option value={0}>انتخاب کنید</option>
                      {superAdmins.filter((admin: SuperAdmin) => !admin.emailVerified || (admin.phone && !admin.phoneVerified)).map((admin: SuperAdmin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.username} - {admin.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="verificationType">نوع تایید</Label>
                    <select
                      id="verificationType"
                      className="w-full p-2 border rounded-md"
                      value={verificationData.type}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, type: e.target.value as 'email' | 'sms' }))}
                    >
                      <option value="email">ایمیل</option>
                      <option value="sms">پیامک</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="verificationCode">کد تایید</Label>
                    <Input
                      id="verificationCode"
                      value={verificationData.code}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="کد 6 رقمی را وارد کنید"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={() => verifyCodeMutation.mutate(verificationData)}
                    disabled={verifyCodeMutation.isPending || !verificationData.adminId || !verificationData.code}
                    className="w-full"
                  >
                    {verifyCodeMutation.isPending ? "در حال تایید..." : "تایید کد"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>کدهای تایید در انتظار</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingVerifications ? (
                    <div className="text-center py-4">در حال بارگذاری...</div>
                  ) : (
                    <div className="space-y-3">
                      {pendingVerifications.map((verification: PendingVerification) => (
                        <div key={verification.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{verification.email}</p>
                              <p className="text-sm text-slate-600">
                                {verification.type === 'email' ? 'ایمیل' : 'پیامک'} - 
                                کد: {verification.verificationCode}
                              </p>
                              <p className="text-xs text-slate-500">
                                انقضا: {new Date(verification.expiresAt).toLocaleString('fa-IR')}
                              </p>
                            </div>
                            <Badge variant={new Date(verification.expiresAt) > new Date() ? "default" : "destructive"}>
                              {new Date(verification.expiresAt) > new Date() ? "فعال" : "منقضی"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Password Reset */}
          <TabsContent value="reset">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>درخواست بازیابی رمز عبور</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resetEmail">ایمیل سوپر ادمین</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      value={resetEmailData.email}
                      onChange={(e) => setResetEmailData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="آدرس ایمیل را وارد کنید"
                    />
                  </div>
                  <Button
                    onClick={() => passwordResetMutation.mutate(resetEmailData.email)}
                    disabled={passwordResetMutation.isPending || !resetEmailData.email}
                    className="w-full"
                  >
                    {passwordResetMutation.isPending ? "در حال ارسال..." : "ارسال کد بازیابی"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>تغییر رمز عبور با کد</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resetCode">کد بازیابی</Label>
                    <Input
                      id="resetCode"
                      value={resetEmailData.verificationCode}
                      onChange={(e) => setResetEmailData(prev => ({ ...prev, verificationCode: e.target.value }))}
                      placeholder="کد 6 رقمی دریافتی از ایمیل"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">رمز عبور جدید</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={resetEmailData.newPassword}
                      onChange={(e) => setResetEmailData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="رمز عبور جدید را وارد کنید"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmNewPassword">تایید رمز عبور جدید</Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      value={resetEmailData.confirmNewPassword}
                      onChange={(e) => setResetEmailData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                      placeholder="رمز عبور جدید را مجدداً وارد کنید"
                    />
                  </div>
                  <Button
                    onClick={handleResetPassword}
                    disabled={resetPasswordMutation.isPending || !resetEmailData.verificationCode || !resetEmailData.newPassword}
                    className="w-full"
                  >
                    {resetPasswordMutation.isPending ? "در حال تغییر..." : "تغییر رمز عبور"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}