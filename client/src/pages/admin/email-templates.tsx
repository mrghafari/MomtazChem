import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Eye, 
  Copy,
  Code,
  Globe,
  Filter,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.enum(["quote_response", "product_info", "technical_support", "general", "welcome", "followup"]),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  textContent: z.string().optional(),
  language: z.enum(["en", "fa"]).default("en"),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface EmailTemplate {
  id: number;
  name: string;
  category: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  isActive: boolean;
  isDefault: boolean;
  language: string;
  createdBy: number;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels = {
  quote_response: "Quote Response",
  product_info: "Product Information",
  technical_support: "Technical Support",
  general: "General",
  welcome: "Welcome",
  followup: "Follow-up"
};

const templateVariables = {
  common: [
    "{{customer_name}}", "{{customer_email}}", "{{customer_company}}", 
    "{{inquiry_number}}", "{{date}}", "{{time}}"
  ],
  product: [
    "{{product_name}}", "{{product_category}}", "{{product_price}}", 
    "{{product_description}}", "{{product_features}}"
  ],
  support: [
    "{{support_agent}}", "{{ticket_number}}", "{{priority}}", 
    "{{estimated_resolution}}", "{{solution_steps}}"
  ]
};

export default function EmailTemplates() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/admin/email/templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: TemplateFormData) => apiRequest("/api/admin/email/templates", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/templates"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Template Created",
        description: "Email template has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create email template.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TemplateFormData> }) =>
      apiRequest(`/api/admin/email/templates/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/templates"] });
      setEditingTemplate(null);
      toast({
        title: "Template Updated",
        description: "Email template has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update email template.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/email/templates/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/templates"] });
      toast({
        title: "Template Deleted",
        description: "Email template has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete email template.",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: ({ id, category }: { id: number; category: string }) =>
      apiRequest(`/api/admin/email/templates/${id}/set-default`, "POST", { category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/templates"] });
      toast({
        title: "Default Template Set",
        description: "Template has been set as default for this category.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set default template.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      category: "general",
      subject: "",
      htmlContent: "",
      textContent: "",
      language: "en",
      isActive: true,
      isDefault: false,
    },
  });

  const filteredTemplates = templates.filter((template: EmailTemplate) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const onSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      category: template.category as any,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
      language: template.language as any,
      isActive: template.isActive,
      isDefault: template.isDefault,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleSetDefault = (template: EmailTemplate) => {
    setDefaultMutation.mutate({ id: template.id, category: template.category });
  };

  const insertVariable = (variable: string) => {
    const currentContent = form.getValues("htmlContent");
    form.setValue("htmlContent", currentContent + variable);
  };

  const resetForm = () => {
    form.reset();
    setEditingTemplate(null);
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">Manage customizable email templates for support responses</p>
        </div>
        
        <Dialog open={isCreateDialogOpen || !!editingTemplate} onOpenChange={(open) => {
          if (!open) resetForm();
          else setIsCreateDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Email Template" : "Create Email Template"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Welcome Email Template" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(categoryLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Re: Your inquiry about {{product_name}}" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="fa">فارسی</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Active</FormLabel>
                          <p className="text-xs text-gray-500">Template is available for use</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Default</FormLabel>
                          <p className="text-xs text-gray-500">Default template for category</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>HTML Content</FormLabel>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => insertVariable("{{customer_name}}")}>
                        <Code className="w-3 h-3 mr-1" />
                        Insert Variable
                      </Button>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="html" className="w-full">
                    <TabsList>
                      <TabsTrigger value="html">HTML Content</TabsTrigger>
                      <TabsTrigger value="variables">Variables</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="html">
                      <FormField
                        control={form.control}
                        name="htmlContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={12}
                                placeholder={`<h2>Hello {{customer_name}},</h2>
<p>Thank you for your inquiry about {{product_name}}.</p>
<p>Best regards,<br/>Momtazchem Team</p>`}
                                className="font-mono text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="variables">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Common Variables</h4>
                          <div className="flex flex-wrap gap-2">
                            {templateVariables.common.map((variable) => (
                              <Button
                                key={variable}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(variable)}
                              >
                                {variable}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Product Variables</h4>
                          <div className="flex flex-wrap gap-2">
                            {templateVariables.product.map((variable) => (
                              <Button
                                key={variable}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(variable)}
                              >
                                {variable}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Support Variables</h4>
                          <div className="flex flex-wrap gap-2">
                            {templateVariables.support.map((variable) => (
                              <Button
                                key={variable}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(variable)}
                              >
                                {variable}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <FormField
                  control={form.control}
                  name="textContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plain Text Content (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={6}
                          placeholder="Plain text version for email clients that don't support HTML"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  >
                    {editingTemplate ? "Update Template" : "Create Template"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template: EmailTemplate) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {template.name}
                      {template.isDefault && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {categoryLabels[template.category as keyof typeof categoryLabels]}
                    </Badge>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      <Globe className="w-3 h-3 mr-1" />
                      {template.language === "en" ? "English" : "فارسی"}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Used {template.usageCount} times</p>
                    {template.lastUsed && (
                      <p>Last used: {new Date(template.lastUsed).toLocaleDateString()}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!template.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(template)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(template.htmlContent);
                        toast({ title: "Copied", description: "Template content copied to clipboard" });
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Templates Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory !== "all" 
                ? "No templates match your current filters."
                : "Get started by creating your first email template."
              }
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {previewTemplate.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Subject:</h4>
                <p className="text-sm bg-gray-50 p-2 rounded">{previewTemplate.subject}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">HTML Content:</h4>
                <div 
                  className="border rounded p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }}
                />
              </div>
              
              {previewTemplate.textContent && (
                <div>
                  <h4 className="font-medium mb-2">Text Content:</h4>
                  <pre className="text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap">
                    {previewTemplate.textContent}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}