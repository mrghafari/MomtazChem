import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Key, RefreshCw, Shield, Mail, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PasswordManagementProps {
  customerId: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
}

interface PasswordStatus {
  customerId: number;
  email: string;
  hasPassword: boolean;
  maskedPassword: string;
  lastPasswordChange: string;
}

export function PasswordManagement({ customerId, customerEmail, customerName, customerPhone }: PasswordManagementProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [generatePasswordOpen, setGeneratePasswordOpen] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch password status
  const { mutate: fetchPasswordStatus, isPending: fetchingStatus } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/crm/customers/${customerId}/password-status`);
      return response.data;
    },
    onSuccess: (data) => {
      setPasswordStatus(data);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch password status",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const { mutate: changePassword, isPending: changingPassword } = useMutation({
    mutationFn: async ({ password, notification }: { password: string; notification: boolean }) => {
      return await apiRequest(`/api/crm/customers/${customerId}/change-password`, {
        method: "POST",
        body: { newPassword: password, sendNotification: notification },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Password changed successfully",
      });
      setChangePasswordOpen(false);
      setNewPassword("");
      fetchPasswordStatus();
      queryClient.invalidateQueries({ queryKey: [`/api/crm/customers/${customerId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Generate random password mutation
  const { mutate: generatePassword, isPending: generatingPassword } = useMutation({
    mutationFn: async ({ notification }: { notification: boolean }) => {
      return await apiRequest(`/api/crm/customers/${customerId}/generate-password`, {
        method: "POST",
        body: { sendNotification: notification },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Random password generated successfully",
      });
      setGeneratePasswordOpen(false);
      fetchPasswordStatus();
      queryClient.invalidateQueries({ queryKey: [`/api/crm/customers/${customerId}`] });
      
      // Show generated password to admin
      if (data.data?.generatedPassword) {
        toast({
          title: "Generated Password",
          description: `New password: ${data.data.generatedPassword}`,
          duration: 10000,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate password",
        variant: "destructive",
      });
    },
  });

  // Load password status on mount
  React.useEffect(() => {
    fetchPasswordStatus();
  }, [customerId]);

  const handleChangePassword = () => {
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Password cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    changePassword({ password: newPassword, notification: sendNotification });
  };

  const handleGeneratePassword = () => {
    generatePassword({ notification: sendNotification });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Password Management
        </CardTitle>
        <CardDescription>
          Manage customer password and authentication settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Password Status Display */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">Current Password</p>
              <p className="text-sm text-gray-600">
                {passwordStatus?.hasPassword ? (
                  <span className="flex items-center gap-2">
                    {showPassword ? passwordStatus.maskedPassword : "••••••••"}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </span>
                ) : (
                  "No password set"
                )}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPasswordStatus()}
            disabled={fetchingStatus}
          >
            {fetchingStatus ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        {/* Password Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Change Password */}
          <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Change Customer Password</DialogTitle>
                <DialogDescription>
                  Set a new password for {customerName} ({customerEmail})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send-notification"
                    checked={sendNotification}
                    onCheckedChange={setSendNotification}
                  />
                  <Label htmlFor="send-notification" className="text-sm">
                    Send password notification
                  </Label>
                </div>
                
                {sendNotification && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4" />
                      <span>Email will be sent to: {customerEmail}</span>
                    </div>
                    {customerPhone && (
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>SMS will be sent to: {customerPhone}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setChangePasswordOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Generate Random Password */}
          <Dialog open={generatePasswordOpen} onOpenChange={setGeneratePasswordOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Random Password
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Generate Random Password</DialogTitle>
                <DialogDescription>
                  Generate a secure random password for {customerName} ({customerEmail})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send-notification-gen"
                    checked={sendNotification}
                    onCheckedChange={setSendNotification}
                  />
                  <Label htmlFor="send-notification-gen" className="text-sm">
                    Send password notification
                  </Label>
                </div>
                
                {sendNotification && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4" />
                      <span>Email will be sent to: {customerEmail}</span>
                    </div>
                    {customerPhone && (
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>SMS will be sent to: {customerPhone}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md">
                  <strong>Note:</strong> A secure 8-character password will be generated containing letters, numbers, and special characters.
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setGeneratePasswordOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGeneratePassword}
                    disabled={generatingPassword}
                  >
                    {generatingPassword ? "Generating..." : "Generate Password"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Password Status Info */}
        {passwordStatus && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <p><strong>Customer:</strong> {customerName}</p>
            <p><strong>Email:</strong> {customerEmail}</p>
            <p><strong>Password Status:</strong> {passwordStatus.hasPassword ? "Set" : "Not Set"}</p>
            <p><strong>Last Updated:</strong> {new Date(passwordStatus.lastPasswordChange).toLocaleString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}