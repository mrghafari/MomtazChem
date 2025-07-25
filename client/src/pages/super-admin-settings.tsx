import { useState, useEffect } from "react";
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

  // Clear form function
  const clearForm = () => {
    setNewAdminData({
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Ensure form is clear on component mount
  useEffect(() => {
    clearForm();
  }, []);

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
      return await apiRequest('/api/super-admin/create', 'POST', data);
    },
    onSuccess: (response) => {
      toast({
        title: "Super Admin Created",
        description: response.message || "New super admin created successfully. Email verification code sent.",
      });
      clearForm();
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/pending-verifications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error creating super admin",
        variant: "destructive"
      });
    }
  });

  // Send verification code
  const sendVerificationMutation = useMutation({
    mutationFn: async ({ adminId, type }: { adminId: number, type: 'email' | 'sms' }) => {
      return await apiRequest('/api/super-admin/send-verification', 'POST', { adminId, type });
    },
    onSuccess: (response) => {
      toast({
        title: "Verification Code Sent",
        description: response.message || "Verification code sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error sending verification code",
        variant: "destructive"
      });
    }
  });

  // Verify code
  const verifyCodeMutation = useMutation({
    mutationFn: async (data: typeof verificationData) => {
      return await apiRequest('/api/super-admin/verify', 'POST', data);
    },
    onSuccess: (response) => {
      toast({
        title: "Verification Successful",
        description: response.message || "Account verified successfully",
      });
      setVerificationData({ adminId: 0, type: 'email', code: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/pending-verifications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid verification code",
        variant: "destructive"
      });
    }
  });

  // Password reset request
  const passwordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest('/api/super-admin/forgot-password', 'POST', { email });
    },
    onSuccess: (response) => {
      toast({
        title: "Recovery Code Sent",
        description: response.message || "Password recovery code sent to your email",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error sending recovery code",
        variant: "destructive"
      });
    }
  });

  // Reset password with code
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: typeof resetEmailData) => {
      return await apiRequest('/api/super-admin/reset-password', 'POST', data);
    },
    onSuccess: (response) => {
      toast({
        title: "Password Changed",
        description: response.message || "Password changed successfully",
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
        title: "Error",
        description: error.message || "Error changing password",
        variant: "destructive"
      });
    }
  });

  // Delete super admin
  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: number) => {
      return await apiRequest(`/api/super-admin/admins/${adminId}`, 'DELETE');
    },
    onSuccess: (response) => {
      toast({
        title: "Super Admin Deleted",
        description: response.message || "Super admin deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/admins'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error deleting super admin",
        variant: "destructive"
      });
    }
  });

  const handleCreateAdmin = () => {
    if (newAdminData.password !== newAdminData.confirmPassword) {
      toast({
        title: "Error",
        description: "Password and confirm password do not match",
        variant: "destructive"
      });
      return;
    }
    if (newAdminData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }
    createAdminMutation.mutate(newAdminData);
  };

  const handleResetPassword = () => {
    if (resetEmailData.newPassword !== resetEmailData.confirmNewPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation do not match",
        variant: "destructive"
      });
      return;
    }
    if (resetEmailData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
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
            Super Admin Management
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Create, manage and verify super admin accounts
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create Super Admin</TabsTrigger>
            <TabsTrigger value="manage">Manage Admins</TabsTrigger>
            <TabsTrigger value="verify">Verify Account</TabsTrigger>
            <TabsTrigger value="reset">Reset Password</TabsTrigger>
          </TabsList>

          {/* Create Super Admin */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create New Super Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newAdminData.username}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      value={newAdminData.phone}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={newAdminData.password}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={newAdminData.confirmPassword}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateAdmin}
                  disabled={createAdminMutation.isPending || !newAdminData.username || !newAdminData.email || !newAdminData.password}
                  className="w-full"
                >
                  {createAdminMutation.isPending ? "Creating..." : "Create Super Admin"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Super Admins */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Super Admin List</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdmins ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="space-y-4">
                    {superAdmins?.map((admin: SuperAdmin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{admin.username}</h3>
                            <Badge variant={admin.isActive ? "default" : "secondary"}>
                              {admin.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {admin.emailVerified && (
                              <Badge variant="outline" className="text-green-600">
                                <Mail className="h-3 w-3 mr-1" />
                                Email Verified
                              </Badge>
                            )}
                            {admin.phoneVerified && (
                              <Badge variant="outline" className="text-blue-600">
                                <Phone className="h-3 w-3 mr-1" />
                                Phone Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{admin.email}</p>
                          {admin.phone && (
                            <p className="text-sm text-slate-600">{admin.phone}</p>
                          )}
                          {admin.lastLoginAt && (
                            <p className="text-xs text-slate-500 mt-1">
                              Last login: {new Date(admin.lastLoginAt).toLocaleDateString('en-US')}
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
                              Verify Email
                            </Button>
                          )}
                          {admin.phone && !admin.phoneVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendVerificationMutation.mutate({ adminId: admin.id, type: 'sms' })}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Verify Phone
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
                  <CardTitle>Account Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="adminSelect">Select Admin</Label>
                    <select
                      id="adminSelect"
                      className="w-full p-2 border rounded-md"
                      value={verificationData.adminId}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, adminId: parseInt(e.target.value) }))}
                    >
                      <option value={0}>Select an admin</option>
                      {superAdmins?.filter((admin: SuperAdmin) => !admin.emailVerified || (admin.phone && !admin.phoneVerified)).map((admin: SuperAdmin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.username} - {admin.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="verificationType">Verification Type</Label>
                    <select
                      id="verificationType"
                      className="w-full p-2 border rounded-md"
                      value={verificationData.type}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, type: e.target.value as 'email' | 'sms' }))}
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="verificationCode">Verification Code</Label>
                    <Input
                      id="verificationCode"
                      value={verificationData.code}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={() => verifyCodeMutation.mutate(verificationData)}
                    disabled={verifyCodeMutation.isPending || !verificationData.adminId || !verificationData.code}
                    className="w-full"
                  >
                    {verifyCodeMutation.isPending ? "Verifying..." : "Verify Code"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Verification Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingVerifications ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-3">
                      {pendingVerifications?.map((verification: PendingVerification) => (
                        <div key={verification.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{verification.email}</p>
                              <p className="text-sm text-slate-600">
                                {verification.type === 'email' ? 'Email' : 'SMS'} - 
                                Code: {verification.verificationCode}
                              </p>
                              <p className="text-xs text-slate-500">
                                Expires: {new Date(verification.expiresAt).toLocaleString('en-US')}
                              </p>
                            </div>
                            <Badge variant={new Date(verification.expiresAt) > new Date() ? "default" : "destructive"}>
                              {new Date(verification.expiresAt) > new Date() ? "Active" : "Expired"}
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
                  <CardTitle>Password Recovery Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resetEmail">Super Admin Email</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      value={resetEmailData.email}
                      onChange={(e) => setResetEmailData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <Button
                    onClick={() => passwordResetMutation.mutate(resetEmailData.email)}
                    disabled={passwordResetMutation.isPending || !resetEmailData.email}
                    className="w-full"
                  >
                    {passwordResetMutation.isPending ? "Sending..." : "Send Recovery Code"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password with Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resetCode">Recovery Code</Label>
                    <Input
                      id="resetCode"
                      value={resetEmailData.verificationCode}
                      onChange={(e) => setResetEmailData(prev => ({ ...prev, verificationCode: e.target.value }))}
                      placeholder="6-digit code from email"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={resetEmailData.newPassword}
                      onChange={(e) => setResetEmailData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      value={resetEmailData.confirmNewPassword}
                      onChange={(e) => setResetEmailData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                      placeholder="Re-enter new password"
                    />
                  </div>
                  <Button
                    onClick={handleResetPassword}
                    disabled={resetPasswordMutation.isPending || !resetEmailData.verificationCode || !resetEmailData.newPassword}
                    className="w-full"
                  >
                    {resetPasswordMutation.isPending ? "Changing..." : "Change Password"}
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