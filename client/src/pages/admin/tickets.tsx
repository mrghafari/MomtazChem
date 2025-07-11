import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  XCircle,
  PlayCircle,
  ArrowLeft,
  Upload,
  Paperclip,
  Mail,
  Settings,
  BarChart3,
  Calendar,
  Flag,
  Tag
} from "lucide-react";

// Types
interface Ticket {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  categoryId?: number;
  reporterEmail: string;
  reporterName: string;
  assignedTo?: string;
  attachments: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  comments?: TicketComment[];
}

interface TicketComment {
  id: number;
  ticketId: number;
  authorEmail: string;
  authorName: string;
  comment: string;
  isInternal: boolean;
  attachments: string;
  createdAt: string;
}

interface TicketCategory {
  id: number;
  name: string;
  nameAr?: string;
  nameKu?: string;
  description?: string;
  color: string;
  isActive: boolean;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byCategory: Array<{ categoryName: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  avgResolutionTime: number;
}

// Form schemas
const ticketSchema = z.object({
  title: z.string().min(5, "عنوان باید حداقل 5 کاراکتر باشد"),
  description: z.string().min(10, "توضیحات باید حداقل 10 کاراکتر باشد"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  categoryId: z.number().optional(),
  reporterEmail: z.string().email("ایمیل معتبر وارد کنید"),
  reporterName: z.string().min(2, "نام گزارش‌دهنده الزامی است"),
  tags: z.string().optional(),
});

const commentSchema = z.object({
  comment: z.string().min(5, "کامنت باید حداقل 5 کاراکتر باشد"),
  isInternal: z.boolean().default(false),
});

const categorySchema = z.object({
  name: z.string().min(2, "نام دسته‌بندی الزامی است"),
  nameAr: z.string().optional(),
  nameKu: z.string().optional(),
  description: z.string().optional(),
  color: z.string().default("#3b82f6"),
});

export default function TicketsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Forms
  const ticketForm = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      reporterEmail: "",
      reporterName: "",
      tags: "",
    },
  });

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      comment: "",
      isInternal: false,
    },
  });

  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      nameAr: "",
      nameKu: "",
      description: "",
      color: "#3b82f6",
    },
  });

  // Queries
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets", { status: statusFilter, priority: priorityFilter, search: searchQuery }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (searchQuery) params.append("search", searchQuery);
      
      return apiRequest(`/api/tickets?${params.toString()}`).then(res => res.data);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/tickets/categories"],
    queryFn: () => apiRequest("/api/tickets/categories").then(res => res.data),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/tickets/stats"],
    queryFn: () => apiRequest("/api/tickets/stats").then(res => res.data),
  });

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: async (data: z.infer<typeof ticketSchema>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      if (selectedFiles) {
        Array.from(selectedFiles).forEach(file => {
          formData.append('attachments', file);
        });
      }

      return apiRequest("/api/tickets", "POST", formData);
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "تیکت با موفقیت ایجاد شد",
      });
      setShowCreateDialog(false);
      ticketForm.reset();
      setSelectedFiles(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats"] });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در ایجاد تیکت",
        variant: "destructive",
      });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/tickets/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "تیکت به‌روزرسانی شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/stats"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: number; data: z.infer<typeof commentSchema> }) => {
      const formData = new FormData();
      formData.append("comment", data.comment);
      formData.append("isInternal", data.isInternal.toString());

      if (selectedFiles) {
        Array.from(selectedFiles).forEach(file => {
          formData.append('attachments', file);
        });
      }

      return apiRequest(`/api/tickets/${ticketId}/comments`, "POST", formData);
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "پاسخ اضافه شد",
      });
      commentForm.reset();
      setSelectedFiles(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: z.infer<typeof categorySchema>) => {
      return apiRequest("/api/tickets/categories", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "دسته‌بندی ایجاد شد",
      });
      setShowCategoryDialog(false);
      categoryForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/categories"] });
    },
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="w-4 h-4" />;
      case "in_progress": return <PlayCircle className="w-4 h-4" />;
      case "resolved": return <CheckCircle className="w-4 h-4" />;
      case "closed": return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "urgent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return "باز";
      case "in_progress": return "در حال بررسی";
      case "resolved": return "حل شده";
      case "closed": return "بسته";
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low": return "کم";
      case "medium": return "متوسط";
      case "high": return "بالا";
      case "urgent": return "فوری";
      default: return priority;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = (ticketId: number, newStatus: string) => {
    updateTicketMutation.mutate({
      id: ticketId,
      data: { status: newStatus }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/admin")}
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            بازگشت به پنل مدیریت
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مدیریت تیکت‌ها</h1>
            <p className="text-gray-600 mt-1">مدیریت و پیگیری تیکت‌های پشتیبانی</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tag className="w-4 h-4 mr-2" />
                دسته‌بندی جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>ایجاد دسته‌بندی جدید</DialogTitle>
              </DialogHeader>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام دسته‌بندی</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثال: مشکلات فنی" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توضیحات</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="توضیحات اختیاری..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رنگ</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                      انصراف
                    </Button>
                    <Button type="submit" disabled={createCategoryMutation.isPending}>
                      {createCategoryMutation.isPending ? "در حال ایجاد..." : "ایجاد"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                تیکت جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>ایجاد تیکت جدید</DialogTitle>
              </DialogHeader>
              <Form {...ticketForm}>
                <form onSubmit={ticketForm.handleSubmit((data) => createTicketMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={ticketForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان تیکت</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="عنوان مشکل یا درخواست..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ticketForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اولویت</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب اولویت" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">کم</SelectItem>
                              <SelectItem value="medium">متوسط</SelectItem>
                              <SelectItem value="high">بالا</SelectItem>
                              <SelectItem value="urgent">فوری</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={ticketForm.control}
                      name="reporterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام گزارش‌دهنده</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="نام و نام خانوادگی" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ticketForm.control}
                      name="reporterEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ایمیل گزارش‌دهنده</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="example@domain.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={ticketForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>دسته‌بندی</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب دسته‌بندی" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category: TicketCategory) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ticketForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توضیحات</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="توضیحات کامل مشکل یا درخواست..." className="min-h-[100px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ticketForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>برچسب‌ها (اختیاری)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="برچسب‌ها را با کاما جدا کنید" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">فایل‌های ضمیمه (اختیاری)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                        onChange={handleFileSelect}
                        className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <Paperclip className="w-4 h-4 text-gray-400" />
                    </div>
                    {selectedFiles && (
                      <div className="text-sm text-gray-600">
                        {selectedFiles.length} فایل انتخاب شده
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      انصراف
                    </Button>
                    <Button type="submit" disabled={createTicketMutation.isPending}>
                      {createTicketMutation.isPending ? "در حال ایجاد..." : "ایجاد تیکت"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("all")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">کل تیکت‌ها</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("open")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">باز</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.open}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("in_progress")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">در حال بررسی</p>
                  <p className="text-2xl font-bold text-yellow-800">{stats.inProgress}</p>
                </div>
                <PlayCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("resolved")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">حل شده</p>
                  <p className="text-2xl font-bold text-green-800">{stats.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("closed")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">بسته</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.closed}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="جستجو در تیکت‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فیلتر وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="open">باز</SelectItem>
            <SelectItem value="in_progress">در حال بررسی</SelectItem>
            <SelectItem value="resolved">حل شده</SelectItem>
            <SelectItem value="closed">بسته</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فیلتر اولویت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه اولویت‌ها</SelectItem>
            <SelectItem value="low">کم</SelectItem>
            <SelectItem value="medium">متوسط</SelectItem>
            <SelectItem value="high">بالا</SelectItem>
            <SelectItem value="urgent">فوری</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {ticketsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : tickets && tickets.length > 0 ? (
          tickets.map((ticket: Ticket) => (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">
                      {ticket.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-2">#{ticket.ticketNumber}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                      {getStatusIcon(ticket.status)}
                      <span className="mr-1">{getStatusLabel(ticket.status)}</span>
                    </Badge>
                    <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                      <Flag className="w-3 h-3 mr-1" />
                      {getPriorityLabel(ticket.priority)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {ticket.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{ticket.reporterName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
                {ticket.comments && ticket.comments.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                    <MessageSquare className="w-3 h-3" />
                    <span>{ticket.comments.length} پاسخ</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">تیکتی یافت نشد</h3>
            <p className="text-gray-500 mb-4">هیچ تیکتی با فیلترهای انتخابی وجود ندارد.</p>
            <Button onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
              setSearchQuery("");
            }}>
              پاک کردن فیلترها
            </Button>
          </div>
        )}
      </div>

      {/* Ticket Detail Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>جزئیات تیکت #{selectedTicket.ticketNumber}</span>
                <div className="flex gap-2">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">باز</SelectItem>
                      <SelectItem value="in_progress">در حال بررسی</SelectItem>
                      <SelectItem value="resolved">حل شده</SelectItem>
                      <SelectItem value="closed">بسته</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg">{selectedTicket.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {getStatusIcon(selectedTicket.status)}
                      <span className="mr-1">{getStatusLabel(selectedTicket.status)}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      <Flag className="w-3 h-3 mr-1" />
                      {getPriorityLabel(selectedTicket.priority)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{selectedTicket.reporterName} ({selectedTicket.reporterEmail})</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <h4 className="font-semibold">پاسخ‌ها و کامنت‌ها</h4>
                {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                  <div className="space-y-4">
                    {selectedTicket.comments.map((comment: TicketComment) => (
                      <div key={comment.id} className={`border rounded-lg p-4 ${comment.isInternal ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.authorName}</span>
                            <span className="text-sm text-gray-500">({comment.authorEmail})</span>
                            {comment.isInternal && (
                              <Badge variant="secondary" className="text-xs">داخلی</Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">هنوز پاسخی ثبت نشده است.</p>
                )}

                {/* Add Comment Form */}
                <div className="border-t pt-4">
                  <h5 className="font-medium mb-3">افزودن پاسخ</h5>
                  <Form {...commentForm}>
                    <form onSubmit={commentForm.handleSubmit((data) => addCommentMutation.mutate({ ticketId: selectedTicket.id, data }))} className="space-y-4">
                      <FormField
                        control={commentForm.control}
                        name="comment"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea {...field} placeholder="پاسخ خود را اینجا بنویسید..." className="min-h-[100px]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center gap-4">
                        <FormField
                          control={commentForm.control}
                          name="isInternal"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="rounded"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">کامنت داخلی (فقط برای ادمین‌ها)</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Input
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                          onChange={handleFileSelect}
                          className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {selectedFiles && (
                          <div className="text-sm text-gray-600">
                            {selectedFiles.length} فایل انتخاب شده
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={addCommentMutation.isPending}>
                          {addCommentMutation.isPending ? "در حال ارسال..." : "ارسال پاسخ"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}