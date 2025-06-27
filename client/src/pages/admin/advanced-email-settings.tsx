import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Settings, TestTube, Save, Plus, Trash2, Edit, Check, X, AlertCircle, CheckCircle, Clock, Eye, EyeOff, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import EmailSetupProgress from "@/components/ui/email-setup-progress";

interface EmailCategory {
  id: number;
  categoryKey: string;
  categoryName: string;
  description: string;
  isActive: boolean;
  smtp?: SmtpSetting | null;
  recipients: EmailRecipient[];
}

interface SmtpSetting {
  id: number;
  categoryId: number;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  isActive: boolean;
  testStatus: string;
  lastTested?: string;
}

interface EmailRecipient {
  id?: number;
  categoryId?: number;
  email: string;
  name?: string;
  isPrimary: boolean;
  isActive: boolean;
  receiveTypes: string[];
}

interface SMTPForm {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export default function AdvancedEmailSettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<EmailCategory | null>(null);
  const [smtpForm, setSmtpForm] = useState<SMTPForm>({
    host: "",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromName: "",
    fromEmail: ""
  });
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [newRecipient, setNewRecipient] = useState<EmailRecipient>({
    email: "",
    name: "",
    isPrimary: false,
    isActive: true,
    receiveTypes: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check-auth");
        const data = await response.json();
        if (!data.success || !data.authenticated) {
          setLocation("/admin/login");
        }
      } catch (error) {
        setLocation("/admin/login");
      }
    };
    checkAuth();
  }, [setLocation]);

  // Initialize categories
  const initCategoriesMutation = useMutation({
    mutationFn: () => fetch("/api/admin/email/init-categories", { method: "POST" }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      toast({ title: "Categories initialized successfully" });
    }
  });

  // Load categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["/api/admin/email/categories"],
    queryFn: () => fetch("/api/admin/email/categories").then(res => res.json())
  });

  // Save SMTP settings
  const saveSmtpMutation = useMutation({
    mutationFn: (data: { categoryId: number; smtp: SMTPForm }) => 
      fetch(`/api/admin/email/smtp/${data.categoryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.smtp)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      toast({ title: "SMTP settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save SMTP settings", variant: "destructive" });
    }
  });

  // Validate SMTP settings (before saving)
  const validateSmtp = async () => {
    if (!smtpForm.username || !smtpForm.password) {
      toast({ title: "Please enter email and password for validation", variant: "destructive" });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const response = await fetch('/api/admin/validate-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: smtpForm.username,
          password: smtpForm.password,
          customHost: smtpForm.host || undefined,
          customPort: smtpForm.port || undefined,
        })
      });
      
      const result = await response.json();
      setValidationResult(result);
      
      if (result.isValid) {
        toast({ title: "SMTP validation successful! You can now save the settings." });
      } else {
        toast({ 
          title: "SMTP validation failed", 
          description: result.errors?.[0] || "Unknown error",
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      setValidationResult({
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        suggestions: [],
        configurationStatus: {
          hostReachable: false,
          portOpen: false,
          tlsSupported: false,
          authenticationWorking: false,
        },
      });
      toast({ title: "Validation failed", variant: "destructive" });
    } finally {
      setIsValidating(false);
    }
  };

  // Test SMTP connection (using proper validation)
  const testSmtpConnection = async () => {
    if (!smtpForm.username || !smtpForm.password) {
      toast({ title: "Please enter email and password for testing", variant: "destructive" });
      return;
    }

    setIsValidating(true);
    
    try {
      const response = await fetch('/api/admin/validate-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: smtpForm.username,
          password: smtpForm.password,
          customHost: smtpForm.host || undefined,
          customPort: smtpForm.port || undefined,
        })
      });
      
      const result = await response.json();
      
      if (result.isValid) {
        toast({ 
          title: "SMTP Connection Successful!", 
          description: "Your email settings are working correctly." 
        });
      } else {
        toast({ 
          title: "SMTP Connection Failed", 
          description: result.errors?.[0] || "Connection test failed",
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Connection Test Failed", 
        description: `Error: ${error.message}`,
        variant: "destructive" 
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Save recipients
  const saveRecipientsMutation = useMutation({
    mutationFn: (data: { categoryId: number; recipients: EmailRecipient[] }) => 
      fetch(`/api/admin/email/recipients/${data.categoryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: data.recipients })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      toast({ title: "Recipients updated successfully" });
    },
    onError: (error: any) => {
      console.error("Failed to save recipients:", error);
      toast({ title: "Failed to save recipients", variant: "destructive" });
    }
  });

  const categories: EmailCategory[] = categoriesData?.categories || [];

  // Load selected category data
  useEffect(() => {
    if (selectedCategory?.smtp) {
      setSmtpForm({
        host: selectedCategory.smtp.host,
        port: selectedCategory.smtp.port,
        secure: selectedCategory.smtp.secure,
        username: selectedCategory.smtp.username,
        password: selectedCategory.smtp.password || "", // Show actual password
        fromName: selectedCategory.smtp.fromName,
        fromEmail: selectedCategory.smtp.fromEmail
      });
    } else {
      setSmtpForm({
        host: "",
        port: 587,
        secure: false,
        username: "",
        password: "",
        fromName: "",
        fromEmail: ""
      });
    }
    
    // Always reload recipients from fresh data
    if (selectedCategory?.recipients && Array.isArray(selectedCategory.recipients)) {
      setRecipients([...selectedCategory.recipients]);
    } else {
      setRecipients([]);
    }
    
    // Reset new recipient form
    setNewRecipient({
      email: "",
      name: "",
      isPrimary: false,
      isActive: true,
      receiveTypes: []
    });
  }, [selectedCategory]);

  const handleSaveSmtp = () => {
    if (!selectedCategory) return;
    saveSmtpMutation.mutate({ categoryId: selectedCategory.id, smtp: smtpForm });
  };

  const handleTestSmtp = () => {
    testSmtpConnection();
  };

  const handleSaveRecipients = () => {
    if (!selectedCategory) return;
    saveRecipientsMutation.mutate({ categoryId: selectedCategory.id, recipients });
  };

  const addRecipient = () => {
    if (!newRecipient.email) return;
    setRecipients([...recipients, { ...newRecipient, id: Date.now() }]);
    setNewRecipient({
      email: "",
      name: "",
      isPrimary: false,
      isActive: true,
      receiveTypes: []
    });
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (categoryKey: string) => {
    const colors = {
      "admin": "bg-blue-100 text-blue-800",
      "fuel-additives": "bg-orange-100 text-orange-800",
      "water-treatment": "bg-cyan-100 text-cyan-800",
      "agricultural-fertilizers": "bg-green-100 text-green-800",
      "paint-thinner": "bg-purple-100 text-purple-800",
      "orders": "bg-yellow-100 text-yellow-800",
      "notifications": "bg-gray-100 text-gray-800"
    };
    return colors[categoryKey as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading email settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => setLocation("/admin")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Advanced Email Management</h1>
          <p className="text-gray-600 mt-1">Configure independent SMTP settings for each product category</p>
        </div>
      </div>

      {categories.length === 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Initialize Email Categories</CardTitle>
            <CardDescription>
              Set up the default email categories for your chemical products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => initCategoriesMutation.mutate()}>
              Initialize Categories
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Email Categories</h2>
          <p className="text-gray-600">Configure SMTP settings and recipients for each category</p>
        </div>
        <Button
          onClick={() => setLocation("/admin/email-progress")}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          🎯 Progress Tracker
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-1">
          <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategory?.id === category.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getCategoryColor(category.categoryKey)}>
                      {category.categoryName}
                    </Badge>
                    {category.smtp && getTestStatusIcon(category.smtp.testStatus)}
                  </div>
                  <p className="text-sm text-gray-600">{category.description}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {category.recipients.length} recipients
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {category.smtp ? "SMTP configured" : "No SMTP"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          {selectedCategory ? (
            <Tabs defaultValue="smtp" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="smtp">SMTP Settings</TabsTrigger>
                <TabsTrigger value="recipients">Email Recipients</TabsTrigger>
                <TabsTrigger value="control">Email Control Panel</TabsTrigger>
              </TabsList>

              <TabsContent value="smtp">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      SMTP Configuration - {selectedCategory.categoryName}
                    </CardTitle>
                    <CardDescription>
                      Configure independent SMTP settings for this category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="host">SMTP Host</Label>
                        <Input
                          id="host"
                          value={smtpForm.host}
                          onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          type="number"
                          value={smtpForm.port}
                          onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="secure"
                        checked={smtpForm.secure}
                        onCheckedChange={(checked) => setSmtpForm({ ...smtpForm, secure: checked })}
                      />
                      <Label htmlFor="secure">Use SSL/TLS</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={smtpForm.username}
                          onChange={(e) => {
                            const username = e.target.value;
                            setSmtpForm({ 
                              ...smtpForm, 
                              username,
                              fromEmail: username || smtpForm.fromEmail
                            });
                          }}
                          placeholder="your-email@domain.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          For Zoho Mail: Use App Password (not regular password)
                        </p>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={smtpForm.password}
                            onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                            placeholder="Enter App Password for Zoho"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fromName">From Name</Label>
                        <Input
                          id="fromName"
                          value={smtpForm.fromName}
                          onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                          placeholder="Momtaz Chemical"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fromEmail">From Email</Label>
                        <Input
                          id="fromEmail"
                          value={smtpForm.fromEmail}
                          onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                          placeholder="noreply@momtazchem.com"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Validation Section */}
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={validateSmtp}
                          disabled={isValidating || !smtpForm.username || !smtpForm.password}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                        >
                          {isValidating ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
                              Validating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Validate SMTP
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={handleSaveSmtp}
                          disabled={saveSmtpMutation.isPending || (validationResult && !validationResult.isValid)}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save SMTP Settings
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={handleTestSmtp}
                          disabled={isValidating}
                        >
                          {isValidating ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube className="w-4 h-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Validation Results */}
                      {validationResult && (
                        <div className={`p-4 rounded-lg border ${
                          validationResult.isValid 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {validationResult.isValid ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-800">SMTP Validation Successful</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="font-medium text-red-800">SMTP Validation Failed</span>
                              </>
                            )}
                          </div>
                          
                          {validationResult.errors && validationResult.errors.length > 0 && (
                            <div className="mb-2">
                              <div className="text-sm font-medium text-red-700 mb-1">Errors:</div>
                              <ul className="text-sm text-red-600 list-disc list-inside">
                                {validationResult.errors.map((error: string, idx: number) => (
                                  <li key={idx}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                            <div className="mb-2">
                              <div className="text-sm font-medium text-orange-700 mb-1">Suggestions:</div>
                              <ul className="text-sm text-orange-600 list-disc list-inside">
                                {validationResult.suggestions.map((suggestion: string, idx: number) => (
                                  <li key={idx}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {validationResult.configurationStatus && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                {validationResult.configurationStatus.hostReachable ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span>Host Reachable</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {validationResult.configurationStatus.authenticationWorking ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span>Authentication</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedCategory.smtp && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <strong>Current Status:</strong>
                          {getTestStatusIcon(selectedCategory.smtp.testStatus)}
                          <span className="capitalize">{selectedCategory.smtp.testStatus}</span>
                        </div>
                        {selectedCategory.smtp.lastTested && (
                          <p className="text-sm text-gray-600">
                            Last tested: {new Date(selectedCategory.smtp.lastTested).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recipients">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Recipients - {selectedCategory.categoryName}</CardTitle>
                    <CardDescription>
                      Manage who receives emails for this category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add New Recipient */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Add New Recipient</h4>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label htmlFor="newEmail">Email</Label>
                          <Input
                            id="newEmail"
                            value={newRecipient.email}
                            onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                            placeholder="email@domain.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newName">Name (Optional)</Label>
                          <Input
                            id="newName"
                            value={newRecipient.name}
                            onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                            placeholder="Recipient Name"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="newPrimary"
                            checked={newRecipient.isPrimary}
                            onCheckedChange={(checked) => setNewRecipient({ ...newRecipient, isPrimary: checked })}
                          />
                          <Label htmlFor="newPrimary">Primary recipient</Label>
                        </div>
                      </div>
                      <Button onClick={addRecipient} disabled={!newRecipient.email}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Recipient
                      </Button>
                    </div>

                    {/* Recipients List */}
                    <div className="space-y-3">
                      {recipients.map((recipient, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <strong>{recipient.email}</strong>
                                {recipient.isPrimary && (
                                  <Badge variant="default">Primary</Badge>
                                )}
                              </div>
                              {recipient.name && (
                                <p className="text-sm text-gray-600">{recipient.name}</p>
                              )}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeRecipient(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleSaveRecipients}
                      disabled={saveRecipientsMutation.isPending}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Recipients
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="control">
                <div className="space-y-6">
                  {/* CC Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Centralized Email Monitoring (CC Configuration)
                      </CardTitle>
                      <CardDescription>
                        Configure automatic CC for all outgoing emails to ensure centralized oversight
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">Centralized CC Active</span>
                        </div>
                        <p className="text-blue-700 text-sm">
                          All emails (contact forms, product inquiries, password resets, quote requests) 
                          automatically CC <strong>info@momtazchem.com</strong> for comprehensive monitoring.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Current CC Email</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            This email receives a copy of every outgoing email
                          </p>
                          <div className="bg-gray-50 p-3 rounded border text-center">
                            <code className="font-mono text-sm">info@momtazchem.com</code>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Email Types Covered</h4>
                          <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Contact Form Submissions
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Customer Confirmations
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Product Inquiries
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Password Reset Emails
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Quote Requests
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Intelligent Routing Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Intelligent Email Routing Configuration
                      </CardTitle>
                      <CardDescription>
                        Manage automatic routing of contact forms to appropriate departments based on product categories
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900">Intelligent Routing Active</span>
                        </div>
                        <p className="text-green-700 text-sm">
                          Contact forms are automatically routed to appropriate departments based on product interest selection.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Product Category → Department Mapping</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-600">fuel-additives</span>
                              <span className="font-medium">Fuel Additives Dept</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-600">water-treatment</span>
                              <span className="font-medium">Water Treatment Dept</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-600">paint-thinner</span>
                              <span className="font-medium">Paint & Thinner Dept</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-600">agricultural-fertilizers</span>
                              <span className="font-medium">Agricultural Dept</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-600">other</span>
                              <span className="font-medium">Support Dept</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-gray-600">custom-solutions</span>
                              <span className="font-medium">Sales Dept</span>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Smart Features</h4>
                          <ul className="text-sm space-y-2">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div>
                                <strong>Automatic Detection:</strong> Reads product interest from contact forms
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div>
                                <strong>Fallback System:</strong> Routes to admin when departments lack recipients
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div>
                                <strong>Professional Confirmations:</strong> Department-specific confirmation emails
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div>
                                <strong>Complete Logging:</strong> All routing decisions tracked for analytics
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email System Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Email System Status & Control
                      </CardTitle>
                      <CardDescription>
                        Monitor and control the overall email system functionality
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="font-medium text-green-900">CC Monitoring</div>
                          <div className="text-sm text-green-700">Active</div>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="font-medium text-green-900">Smart Routing</div>
                          <div className="text-sm text-green-700">Active</div>
                        </div>
                        
                        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <Settings className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <div className="font-medium text-blue-900">Email Logging</div>
                          <div className="text-sm text-blue-700">Enabled</div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-900 mb-1">Email System Administration</h4>
                            <p className="text-yellow-700 text-sm mb-3">
                              The email system is configured with centralized monitoring and intelligent routing. 
                              All changes to CC settings and routing logic require code-level modifications for security.
                            </p>
                            <div className="text-sm">
                              <strong>Current Configuration:</strong>
                              <ul className="list-disc list-inside mt-1 space-y-1 text-yellow-700">
                                <li>CC Email: info@momtazchem.com (hardcoded for security)</li>
                                <li>Routing Logic: Based on product category mapping</li>
                                <li>Fallback: Automatic admin routing when departments unavailable</li>
                                <li>Logging: All email activities tracked in database</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>
                        Common email system administration tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => window.open('/admin/email-routing-stats', '_blank')}
                          variant="outline" 
                          className="h-16 flex-col space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            View Email Routing Statistics
                          </div>
                          <div className="text-xs text-gray-500">Monitor routing performance</div>
                        </Button>
                        
                        <Button 
                          onClick={() => window.open('/admin/smtp-test', '_blank')}
                          variant="outline" 
                          className="h-16 flex-col space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <TestTube className="w-4 h-4" />
                            Test SMTP Configuration
                          </div>
                          <div className="text-xs text-gray-500">Validate email settings</div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Category</h3>
                  <p className="text-gray-600">Choose an email category from the left to configure its settings</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}