import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Mail, 
  User, 
  Calendar, 
  Search, 
  MessageSquare, 
  Users,
  BarChart3,
  Eye,
  Reply,
  Trash2,
  Plus
} from "lucide-react";

interface CustomerCommunication {
  id: number;
  categoryId: number;
  customerEmail: string;
  customerName?: string;
  subject: string;
  message: string;
  messageType: "outbound" | "inbound" | "follow_up";
  status: "sent" | "delivered" | "read" | "replied" | "failed";
  sentBy?: number;
  replyToMessageId?: number;
  attachments?: string[];
  emailId?: string;
  readAt?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailCategory {
  id: number;
  categoryKey: string;
  categoryName: string;
  description?: string;
  isActive: boolean;
}

interface CommunicationStats {
  total: number;
  sent: number;
  received: number;
  followUps: number;
  replied: number;
  pending: number;
}

export default function CustomerCommunications() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<EmailCategory[]>({
    queryKey: ["/api/admin/email/categories"],
    retry: false,
  });

  // Fetch communications by category
  const { data: communications = [], isLoading } = useQuery<CustomerCommunication[]>({
    queryKey: ["/api/customer-communications/category", selectedCategory],
    enabled: !!selectedCategory,
  });

  // Fetch communication stats
  const { data: stats } = useQuery<CommunicationStats>({
    queryKey: ["/api/customer-communications/stats", selectedCategory],
    enabled: !!selectedCategory,
  });

  // Fetch recent communications
  const { data: recentCommunications = [] } = useQuery<CustomerCommunication[]>({
    queryKey: ["/api/customer-communications/recent"],
  });

  // Search communications
  const { data: searchResults = [] } = useQuery<CustomerCommunication[]>({
    queryKey: ["/api/customer-communications/search", searchTerm],
    enabled: searchTerm.length > 2,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      categoryId: number;
      customerEmail: string;
      customerName?: string;
      subject: string;
      message: string;
      messageType?: string;
    }) => {
      return await apiRequest("/api/customer-communications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "پیام ارسال شد",
        description: "پیام شما با موفقیت به مشتری ارسال شد.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-communications"] });
      setShowNewMessageDialog(false);
    },
    onError: () => {
      toast({
        title: "خطا در ارسال پیام",
        description: "مشکلی در ارسال پیام پیش آمد.",
        variant: "destructive",
      });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest(`/api/customer-communications/${messageId}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-communications"] });
      toast({
        title: "بروزرسانی موفق",
        description: "پیام به عنوان خوانده شده علامت‌گذاری شد",
      });
    },
  });

  // Mark as replied mutation
  const markAsRepliedMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest(`/api/customer-communications/${messageId}/replied`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-communications"] });
    },
  });

  // Delete communication mutation
  const deleteCommunicationMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest(`/api/customer-communications/${messageId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "پیام حذف شد",
        description: "پیام با موفقیت حذف شد.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-communications"] });
    },
  });

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      categoryId: selectedCategory!,
      customerEmail: formData.get("customerEmail") as string,
      customerName: formData.get("customerName") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
      messageType: formData.get("messageType") as string || "outbound",
    };

    sendMessageMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: "bg-blue-100 text-blue-800", label: "ارسال شده" },
      delivered: { color: "bg-green-100 text-green-800", label: "تحویل داده شده" },
      read: { color: "bg-purple-100 text-purple-800", label: "خوانده شده" },
      replied: { color: "bg-orange-100 text-orange-800", label: "پاسخ داده شده" },
      failed: { color: "bg-red-100 text-red-800", label: "ناموفق" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getMessageTypeBadge = (type: string) => {
    const typeConfig = {
      outbound: { color: "bg-blue-100 text-blue-800", label: "خروجی" },
      inbound: { color: "bg-green-100 text-green-800", label: "ورودی" },
      follow_up: { color: "bg-yellow-100 text-yellow-800", label: "پیگیری" },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.outbound;
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ارتباط با مشتریان</h1>
          <p className="text-gray-600 mt-2">مدیریت ارتباطات ایمیلی با مشتریان بر اساس دسته‌بندی</p>
        </div>
        <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
          <DialogTrigger asChild>
            <Button disabled={!selectedCategory}>
              <Plus className="h-4 w-4 mr-2" />
              پیام جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ارسال پیام جدید</DialogTitle>
              <DialogDescription>
                پیام جدید به مشتری ارسال کنید
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerEmail">ایمیل مشتری</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerName">نام مشتری</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    type="text"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">موضوع</Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">پیام</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="messageType">نوع پیام</Label>
                <Select name="messageType" defaultValue="outbound">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">خروجی</SelectItem>
                    <SelectItem value="follow_up">پیگیری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNewMessageDialog(false)}>
                  انصراف
                </Button>
                <Button type="submit" disabled={sendMessageMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {sendMessageMutation.isPending ? "در حال ارسال..." : "ارسال پیام"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList>
          <TabsTrigger value="categories">دسته‌بندی‌ها</TabsTrigger>
          <TabsTrigger value="recent">پیام‌های اخیر</TabsTrigger>
          <TabsTrigger value="search">جستجو</TabsTrigger>
          <TabsTrigger value="stats">آمار</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          {categoriesLoading ? (
            <div className="text-center py-8">در حال بارگذاری دسته‌بندی‌ها...</div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
              <Card 
                key={category.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCategory === category.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {category.categoryName}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </CardContent>
              </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              هیچ دسته‌بندی‌ای پیدا نشد
            </div>
          )}

          {selectedCategory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  ارتباطات دسته‌بندی انتخاب شده
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">در حال بارگذاری...</div>
                ) : communications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    هیچ ارتباطی برای این دسته‌بندی وجود ندارد
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {communications.map((comm) => (
                        <div key={comm.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{comm.subject}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <User className="h-4 w-4" />
                                {comm.customerName || comm.customerEmail}
                                <Calendar className="h-4 w-4 ml-4" />
                                {new Date(comm.createdAt).toLocaleDateString("fa-IR")}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(comm.status)}
                              {getMessageTypeBadge(comm.messageType)}
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm mb-3">{comm.message.substring(0, 150)}...</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsReadMutation.mutate(comm.id)}
                              disabled={comm.status === "read"}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              خوانده شده
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRepliedMutation.mutate(comm.id)}
                              disabled={comm.status === "replied"}
                            >
                              <Reply className="h-4 w-4 mr-1" />
                              پاسخ داده شده
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteCommunicationMutation.mutate(comm.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>پیام‌های اخیر</CardTitle>
              <CardDescription>آخرین ارتباطات با مشتریان</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {recentCommunications && recentCommunications.length > 0 ? (
                    recentCommunications.map((comm) => (
                    <div key={comm.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{comm.subject}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <User className="h-4 w-4" />
                            {comm.customerName || comm.customerEmail}
                            <Calendar className="h-4 w-4 ml-4" />
                            {new Date(comm.createdAt).toLocaleDateString("fa-IR")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(comm.status)}
                          {getMessageTypeBadge(comm.messageType)}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{comm.message.substring(0, 150)}...</p>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      هیچ ارتباط اخیری وجود ندارد
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>جستجو در ارتباطات</CardTitle>
              <CardDescription>جستجو بر اساس ایمیل، نام مشتری یا موضوع</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="جستجو..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {searchTerm.length > 2 && (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {searchResults && searchResults.length > 0 ? (
                      searchResults.map((comm) => (
                        <div key={comm.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{comm.subject}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <User className="h-4 w-4" />
                                {comm.customerName || comm.customerEmail}
                                <Calendar className="h-4 w-4 ml-4" />
                                {new Date(comm.createdAt).toLocaleDateString("fa-IR")}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(comm.status)}
                              {getMessageTypeBadge(comm.messageType)}
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{comm.message.substring(0, 150)}...</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        نتیجه‌ای یافت نشد
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">کل ارتباطات</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
                  <div className="text-sm text-gray-600">ارسال شده</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.received}</div>
                  <div className="text-sm text-gray-600">دریافت شده</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.followUps}</div>
                  <div className="text-sm text-gray-600">پیگیری‌ها</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.replied}</div>
                  <div className="text-sm text-gray-600">پاسخ داده شده</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
                  <div className="text-sm text-gray-600">در انتظار</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}