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
import { ArrowLeft, Mail, Settings, TestTube, Save, Plus, Trash2, Edit, Check, X, AlertCircle, CheckCircle, Clock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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

  // Test SMTP connection
  const testSmtpMutation = useMutation({
    mutationFn: (categoryId: number) => 
      fetch(`/api/admin/email/test-smtp/${categoryId}`, { method: "POST" }).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/categories"] });
      toast({ 
        title: data.success ? "SMTP test successful" : "SMTP test failed",
        variant: data.success ? "default" : "destructive"
      });
    }
  });

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
    if (!selectedCategory) return;
    testSmtpMutation.mutate(selectedCategory.id);
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="smtp">SMTP Settings</TabsTrigger>
                <TabsTrigger value="recipients">Email Recipients</TabsTrigger>
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

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveSmtp}
                        disabled={saveSmtpMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save SMTP Settings
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handleTestSmtp}
                        disabled={testSmtpMutation.isPending}
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Connection
                      </Button>
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