import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Ticket, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle,
  XCircle,
  BarChart3,
  Calendar,
  Tag,
  FileText,
  Send,
  Eye,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form schemas
const createTicketSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  description: z.string().min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد"),
  category: z.string().min(1, "انتخاب دسته‌بندی الزامی است"),
  priority: z.string().min(1, "انتخاب اولویت الزامی است"),
  department: z.string().optional(),
});

const responseSchema = z.object({
  message: z.string().min(1, "متن پیام الزامی است"),
  isInternal: z.boolean().default(false),
});

type CreateTicketData = z.infer<typeof createTicketSchema>;
type ResponseData = z.infer<typeof responseSchema>;

// Helper functions for styling
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500 text-white';
    case 'urgent': return 'bg-orange-500 text-white';
    case 'high': return 'bg-yellow-500 text-black';
    case 'normal': return 'bg-blue-500 text-white';
    case 'low': return 'bg-gray-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-green-500 text-white';
    case 'in_progress': return 'bg-blue-500 text-white';
    case 'resolved': return 'bg-purple-500 text-white';
    case 'closed': return 'bg-gray-500 text-white';
    case 'on_hold': return 'bg-yellow-500 text-black';
    default: return 'bg-gray-500 text-white';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'technical_issue': return <AlertTriangle className="w-4 h-4" />;
    case 'bug_report': return <XCircle className="w-4 h-4" />;
    case 'feature_request': return <Plus className="w-4 h-4" />;
    case 'system_error': return <AlertCircle className="w-4 h-4" />;
    case 'user_access': return <UserCheck className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

// Main component
export default function TicketingSystemFixed() {
  const { t, direction } = useLanguage();
  
  // Fallback function in case t is undefined
  const translate = (key: string, fallback: string) => {
    return typeof t === 'function' ? t(key, fallback) : fallback;
  };
  
  // State declarations
  const [activeTab, setActiveTab] = useState("my-tickets");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [ticketDetailOpen, setTicketDetailOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const queryClient = useQueryClient();

  // Queries
  const { data: myTickets } = useQuery({
    queryKey: ['/api/tickets/my-tickets'],
  });

  const { data: allTickets } = useQuery({
    queryKey: ['/api/tickets'],
  });

  const { data: ticketStats } = useQuery({
    queryKey: ['/api/tickets/stats/overview'],
  });

  const { data: userStats } = useQuery({
    queryKey: ['/api/tickets/stats/user'],
  });

  // Check both customer and admin authentication
  const { data: currentUser } = useQuery({
    queryKey: ['/api/customers/me'],
    retry: false,
  });
  
  const { data: adminUser } = useQuery({
    queryKey: ['/api/admin/me'],
    retry: false,
  });
  
  // Determine if user is admin - check both admin session and email patterns
  const isAdmin = Boolean(adminUser?.user) || currentUser?.customer?.email?.includes('admin') || false;
  
  // Get current authenticated user info (admin takes precedence)
  const currentUserInfo = adminUser?.user ? {
    name: adminUser.user.username || 'Admin User',
    email: adminUser.user.email || 'admin@momtazchem.com',
    type: 'admin'
  } : currentUser?.customer ? {
    name: `${currentUser.customer.firstName} ${currentUser.customer.lastName}`.trim() || 'Customer',
    email: currentUser.customer.email,
    type: 'customer'
  } : null;

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: (data: CreateTicketData) => {
      console.log('Creating ticket with data:', data);
      return apiRequest('/api/tickets', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: (response) => {
      console.log('Ticket created successfully:', response);
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/stats/overview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/stats/user'] });
      setCreateTicketOpen(false);
      createForm.reset();
      toast({
        title: "موفقیت",
        description: "تیکت پشتیبانی با موفقیت ایجاد شد",
      });
    },
    onError: (error: any) => {
      console.error('Error creating ticket:', error);
      toast({
        title: "خطا",
        description: error.message || "خطا در ایجاد تیکت",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, status, reason }: { ticketId: number; status: string; reason?: string }) =>
      apiRequest(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: { status, reason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "موفقیت",
        description: "وضعیت تیکت به‌روزرسانی شد",
      });
    },
  });

  const addResponseMutation = useMutation({
    mutationFn: ({ ticketId, message, isInternal }: { ticketId: number; message: string; isInternal: boolean }) =>
      apiRequest(`/api/tickets/${ticketId}/responses`, {
        method: 'POST',
        body: { message, isInternal },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      if (selectedTicket) {
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${selectedTicket.id}`] });
      }
      // Reset the form after successful response
      responseForm.reset();
      toast({
        title: "موفقیت",
        description: "پاسخ اضافه شد",
      });
    },
  });

  // Forms
  const createForm = useForm<CreateTicketData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "normal",
      department: "",
    },
  });

  const responseForm = useForm<ResponseData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      message: "",
      isInternal: false,
    },
  });

  // Event handlers
  const handleCreateTicket = (data: CreateTicketData) => {
    createTicketMutation.mutate(data);
  };

  const handleAddResponse = (data: ResponseData) => {
    if (selectedTicket) {
      addResponseMutation.mutate({
        ticketId: selectedTicket.id,
        message: data.message,
        isInternal: data.isInternal,
      });
      // Form reset is now handled in onSuccess callback
    }
  };

  const handleStatusChange = (ticketId: number, newStatus: string) => {
    if (!isAdmin) {
      toast({
        title: "خطا",
        description: "برای تغییر وضعیت تیکت باید به عنوان ادمین وارد شوید",
        variant: "destructive",
      });
      return;
    }
    updateStatusMutation.mutate({ ticketId, status: newStatus });
  };

  const handleTicketSelect = (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketDetailOpen(true);
  };

  const filteredTickets = (tickets: any[]) => {
    if (!tickets) return [];
    
    return tickets.filter(ticket => {
      const matchesStatus = !filterStatus || filterStatus === 'all' || ticket.status === filterStatus;
      const matchesPriority = !filterPriority || filterPriority === 'all' || ticket.priority === filterPriority;
      const matchesSearch = !searchQuery || 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir={direction}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="w-8 h-8 text-blue-600" />
            {translate('ticketing.title', 'سیستم تیکتینگ')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {translate('ticketing.description', 'مدیریت تیکت‌های پشتیبانی فنی و ارتباط با ادمین')}
          </p>
          {currentUserInfo && (
            <div className="mt-2 text-sm">
              <span className="text-gray-600">کاربر فعلی: </span>
              <span className="font-medium text-blue-600">
                {currentUserInfo.name} ({currentUserInfo.type === 'admin' ? 'مدیر سیستم' : 'مشتری'})
              </span>
            </div>
          )}
        </div>
        
        <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {translate('ticketing.newTicket', 'تیکت جدید')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir={direction}>
            <DialogHeader>
              <DialogTitle>{translate('ticketing.createNewTicket', 'ایجاد تیکت پشتیبانی جدید')}</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateTicket)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('ticketing.title', 'عنوان')} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={translate('ticketing.titlePlaceholder', 'عنوان مشکل را بنویسید...')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('ticketing.category', 'دسته‌بندی')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={translate('ticketing.selectCategory', 'انتخاب دسته‌بندی')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technical_issue">{translate('ticketing.categories.technical', 'مشکل فنی')}</SelectItem>
                          <SelectItem value="bug_report">{translate('ticketing.categories.bug', 'گزارش باگ')}</SelectItem>
                          <SelectItem value="feature_request">{translate('ticketing.categories.feature', 'درخواست ویژگی')}</SelectItem>
                          <SelectItem value="system_error">{translate('ticketing.categories.system', 'خطای سیستم')}</SelectItem>
                          <SelectItem value="user_access">{translate('ticketing.categories.access', 'دسترسی کاربر')}</SelectItem>
                          <SelectItem value="performance_issue">{translate('ticketing.categories.performance', 'مشکل عملکرد')}</SelectItem>
                          <SelectItem value="security_concern">{translate('ticketing.categories.security', 'نگرانی امنیتی')}</SelectItem>
                          <SelectItem value="data_issue">{translate('ticketing.categories.data', 'مشکل داده')}</SelectItem>
                          <SelectItem value="integration_problem">{translate('ticketing.categories.integration', 'مشکل یکپارچه‌سازی')}</SelectItem>
                          <SelectItem value="other">{translate('ticketing.categories.other', 'سایر')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('ticketing.priority', 'اولویت')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={translate('ticketing.selectPriority', 'انتخاب اولویت')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">{translate('ticketing.priorities.low', 'کم')}</SelectItem>
                          <SelectItem value="normal">{translate('ticketing.priorities.normal', 'معمولی')}</SelectItem>
                          <SelectItem value="high">{translate('ticketing.priorities.high', 'زیاد')}</SelectItem>
                          <SelectItem value="urgent">{translate('ticketing.priorities.urgent', 'فوری')}</SelectItem>
                          <SelectItem value="critical">{translate('ticketing.priorities.critical', 'بحرانی')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('ticketing.department', 'بخش مربوطه')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={translate('ticketing.departmentPlaceholder', 'نام بخش یا ماژول مربوطه...')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('ticketing.description', 'توضیحات')} *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder={translate('ticketing.descriptionPlaceholder', 'توضیح کاملی از مشکل، مراحل تکرار، و اطلاعات مرتبط ارائه دهید...')}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createTicketMutation.isPending}
                    className="flex-1"
                  >
                    {createTicketMutation.isPending 
                      ? translate('ticketing.creating', 'در حال ایجاد...') 
                      : translate('ticketing.createTicket', 'ایجاد تیکت')
                    }
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCreateTicketOpen(false)}
                  >
                    {translate('common.cancel', 'انصراف')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Ticket className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{translate('ticketing.stats.myTickets', 'تیکت‌های من')}</p>
                <p className="text-2xl font-bold">{userStats?.data?.totalSubmitted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{translate('ticketing.stats.resolved', 'حل شده')}</p>
                <p className="text-2xl font-bold">{userStats?.data?.resolved || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{translate('ticketing.stats.pending', 'در انتظار')}</p>
                <p className="text-2xl font-bold">{userStats?.data?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{translate('ticketing.stats.total', 'کل تیکت‌ها')}</p>
                <p className="text-2xl font-bold">{ticketStats?.data?.totalTickets || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-tickets">{translate('ticketing.myTickets', 'تیکت‌های من')}</TabsTrigger>
          <TabsTrigger value="all-tickets">{translate('ticketing.allTickets', 'همه تیکت‌ها')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-tickets" className="space-y-4">
          <TicketList 
            tickets={filteredTickets(myTickets?.data || [])}
            onTicketSelect={handleTicketSelect}
            onStatusChange={handleStatusChange}
            isAdmin={isAdmin}
            translate={translate}
          />
        </TabsContent>
        
        <TabsContent value="all-tickets" className="space-y-4">
          <TicketList 
            tickets={filteredTickets(allTickets?.data || [])}
            onTicketSelect={handleTicketSelect}
            onStatusChange={handleStatusChange}
            isAdmin={isAdmin}
            translate={translate}
          />
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      {selectedTicket && (
        <Dialog open={ticketDetailOpen} onOpenChange={setTicketDetailOpen}>
          <DialogContent className="max-w-2xl" dir={direction}>
            <DialogHeader>
              <DialogTitle>جزئیات تیکت #{selectedTicket.ticketNumber}</DialogTitle>
            </DialogHeader>
            <TicketDetail 
              ticket={selectedTicket}
              onAddResponse={handleAddResponse}
              responseForm={responseForm}
              isAdmin={isAdmin}
              translate={translate}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Ticket List Component
function TicketList({ 
  tickets, 
  onTicketSelect, 
  onStatusChange, 
  isAdmin, 
  translate 
}: { 
  tickets: any[], 
  onTicketSelect: (ticket: any) => void, 
  onStatusChange: (ticketId: number, status: string) => void, 
  isAdmin: boolean, 
  translate: (key: string, fallback: string) => string 
}) {
  return (
    <div className="space-y-4">
      {tickets?.map((ticket: any) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  {ticket.category && (
                    <div className="flex items-center gap-1">
                      {getCategoryIcon(ticket.category)}
                      <span className="text-sm text-muted-foreground">{ticket.category}</span>
                    </div>
                  )}
                  {(ticket.priority === 'urgent' || ticket.priority === 'critical') && (
                    <Badge variant="destructive">{translate('ticketing.urgent', 'فوری')}</Badge>
                  )}
                </div>
                
                <h3 className="font-semibold text-lg">{ticket.title}</h3>
                
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {ticket.description}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {ticket.submitterName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(ticket.createdAt).toLocaleDateString('en-US')}
                  </div>
                  {ticket.department && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {ticket.department}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTicketSelect(ticket)}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {translate('ticketing.details', 'جزئیات')}
                </Button>
                
                {ticket.status === 'open' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(ticket.id, 'in_progress')}
                    className="flex items-center gap-1"
                    disabled={!isAdmin}
                    title={!isAdmin ? "نیاز به ورود ادمین" : ""}
                  >
                    <Clock className="w-4 h-4" />
                    {translate('ticketing.start', 'شروع')} {isAdmin ? '' : '(ادمین)'}
                  </Button>
                )}
                
                {ticket.status === 'in_progress' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(ticket.id, 'resolved')}
                    className="flex items-center gap-1"
                    disabled={!isAdmin}
                    title={!isAdmin ? "نیاز به ورود ادمین" : ""}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {translate('ticketing.resolve', 'حل شد')} {isAdmin ? '' : '(ادمین)'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Ticket Detail Component
function TicketDetail({ 
  ticket, 
  onAddResponse, 
  responseForm, 
  isAdmin, 
  translate 
}: { 
  ticket: any, 
  onAddResponse: (data: ResponseData) => void, 
  responseForm: any, 
  isAdmin: boolean, 
  translate: (key: string, fallback: string) => string 
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Badge className={getStatusColor(ticket.status)}>
            {ticket.status}
          </Badge>
          <Badge className={getPriorityColor(ticket.priority)}>
            {ticket.priority}
          </Badge>
        </div>
        <h3 className="font-semibold text-lg mb-2">{ticket.title}</h3>
        <p className="text-muted-foreground">{ticket.description}</p>
      </div>
      
      {isAdmin && (
        <Form {...responseForm}>
          <form onSubmit={responseForm.handleSubmit(onAddResponse)} className="space-y-4">
            <FormField
              control={responseForm.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>پاسخ ادمین</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="پاسخ خود را بنویسید..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              ارسال پاسخ
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}