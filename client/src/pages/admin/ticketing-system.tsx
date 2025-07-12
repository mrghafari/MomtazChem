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

// Define constants locally to bypass API issues
const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent', 'critical'] as const;
const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'on_hold'] as const;
const TICKET_CATEGORIES = [
  'technical_issue',
  'feature_request', 
  'bug_report',
  'system_error',
  'user_access',
  'performance_issue',
  'data_management',
  'integration_issue',
  'security_concern',
  'other'
] as const;

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
export default function TicketingSystem() {
  const { t, direction } = useLanguage();
  
  // Fallback function in case t is undefined
  const translate = (key: string, fallback: string) => {
    return typeof t === 'function' ? t(key, fallback) : fallback;
  };
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
        // Refresh ticket detail
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${selectedTicket.id}`] });
      }
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
      responseForm.reset();
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
                <AlertTriangle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{translate('ticketing.stats.open', 'باز')}</p>
                <p className="text-2xl font-bold">{userStats?.data?.openTickets || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{translate('ticketing.stats.resolved', 'حل شده')}</p>
                <p className="text-2xl font-bold">{userStats?.data?.resolvedTickets || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{translate('ticketing.stats.averageResolution', 'میانگین حل')}</p>
                <p className="text-2xl font-bold">
                  {Math.round(userStats?.data?.averageResolutionTime || 0)}س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder={translate('ticketing.searchPlaceholder', 'جستجو در تیکت‌ها...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={translate('ticketing.status', 'وضعیت')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('common.all', 'همه')}</SelectItem>
                <SelectItem value="open">{translate('ticketing.statuses.open', 'باز')}</SelectItem>
                <SelectItem value="in_progress">{translate('ticketing.statuses.inProgress', 'در حال انجام')}</SelectItem>
                <SelectItem value="resolved">{translate('ticketing.statuses.resolved', 'حل شده')}</SelectItem>
                <SelectItem value="closed">{translate('ticketing.statuses.closed', 'بسته')}</SelectItem>
                <SelectItem value="on_hold">{translate('ticketing.statuses.onHold', 'معوق')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={translate('ticketing.priority', 'اولویت')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('common.all', 'همه')}</SelectItem>
                <SelectItem value="low">{translate('ticketing.priorities.low', 'کم')}</SelectItem>
                <SelectItem value="normal">{translate('ticketing.priorities.normal', 'معمولی')}</SelectItem>
                <SelectItem value="high">{translate('ticketing.priorities.high', 'زیاد')}</SelectItem>
                <SelectItem value="urgent">{translate('ticketing.priorities.urgent', 'فوری')}</SelectItem>
                <SelectItem value="critical">{translate('ticketing.priorities.critical', 'بحرانی')}</SelectItem>
              </SelectContent>
            </Select>
            
            {(filterStatus || filterPriority || searchQuery) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFilterStatus("");
                  setFilterPriority("");
                  setSearchQuery("");
                }}
              >
{translate('ticketing.clearFilters', 'پاک کردن فیلترها')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-tickets">{translate('ticketing.tabs.myTickets', 'تیکت‌های من')}</TabsTrigger>
          <TabsTrigger value="all-tickets">{translate('ticketing.tabs.allTickets', 'همه تیکت‌ها')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-tickets" className="space-y-4">
          <TicketList 
            tickets={filteredTickets(myTickets?.data || [])} 
            onTicketSelect={(ticket) => {
              setSelectedTicket(ticket);
              setTicketDetailOpen(true);
            }}
            onStatusChange={handleStatusChange}
            isAdmin={isAdmin}
          />
        </TabsContent>
        
        <TabsContent value="all-tickets" className="space-y-4">
          <TicketList 
            tickets={filteredTickets(allTickets?.data || [])} 
            onTicketSelect={(ticket) => {
              setSelectedTicket(ticket);
              setTicketDetailOpen(true);
            }}
            onStatusChange={handleStatusChange}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={ticketDetailOpen} onOpenChange={setTicketDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir={direction}>
          {selectedTicket && (
            <TicketDetail 
              ticket={selectedTicket}
              onAddResponse={handleAddResponse}
              responseForm={responseForm}
              onStatusChange={handleStatusChange}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Ticket List Component
function TicketList({ 
  tickets, 
  onTicketSelect, 
  onStatusChange,
  isAdmin 
}: { 
  tickets: any[]; 
  onTicketSelect: (ticket: any) => void;
  onStatusChange: (ticketId: number, status: string) => void;
  isAdmin: boolean;
}) {
  const { t } = useLanguage();
  
  // Local translate function
  const translate = (key: string, fallback: string) => {
    return typeof t === 'function' ? t(key, fallback) : fallback;
  };
  
  if (!tickets || tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{translate('ticketing.noTicketsFound', 'هیچ تیکتی یافت نشد')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(ticket.category)}
                  <span className="font-mono text-sm text-muted-foreground">
                    {ticket.ticketNumber}
                  </span>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                  {ticket.isUrgent && (
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
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setTicketDetailOpen(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {translate('ticketing.details', 'جزئیات')}
                </Button>
                
                {ticket.status === 'open' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(ticket.id, 'in_progress')}
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
                    onClick={() => handleStatusChange(ticket.id, 'resolved')}
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
  onStatusChange 
}: { 
  ticket: any;
  onAddResponse: (data: ResponseData) => void;
  responseForm: any;
  onStatusChange: (ticketId: number, status: string) => void;
}) {
  const { t } = useLanguage();
  
  // Local translate function
  const translate = (key: string, fallback: string) => {
    return typeof t === 'function' ? t(key, fallback) : fallback;
  };
  
  const { data: ticketDetail } = useQuery({
    queryKey: [`/api/tickets/${ticket.id}`],
  });

  const ticketData = ticketDetail?.data?.ticket || ticket;
  const responses = ticketDetail?.data?.responses || [];
  const statusHistory = ticketDetail?.data?.statusHistory || [];

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>{translate('ticketing.ticketDetails', 'جزئیات تیکت')} {ticketData.ticketNumber}</span>
          <div className="flex gap-2">
            <Badge className={getPriorityColor(ticketData.priority)}>
              {ticketData.priority}
            </Badge>
            <Badge className={getStatusColor(ticketData.status)}>
              {ticketData.status}
            </Badge>
          </div>
        </DialogTitle>
      </DialogHeader>
      
      {/* Ticket Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getCategoryIcon(ticketData.category)}
            {ticketData.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{ticketData.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">{translate('ticketing.submitter', 'ایجاد کننده')}:</span> {ticketData.submitterName}
            </div>
            <div>
              <span className="font-medium">{translate('ticketing.email', 'ایمیل')}:</span> {ticketData.submitterEmail}
            </div>
            <div>
              <span className="font-medium">{translate('ticketing.createdAt', 'تاریخ ایجاد')}:</span> {new Date(ticketData.createdAt).toLocaleDateString('en-US')}
            </div>
            <div>
              <span className="font-medium">آخرین به‌روزرسانی:</span> {new Date(ticketData.updatedAt).toLocaleDateString('en-US')}
            </div>
            {ticketData.department && (
              <div>
                <span className="font-medium">بخش:</span> {ticketData.department}
              </div>
            )}
            {ticketData.assignedTo && (
              <div>
                <span className="font-medium">واگذار شده به:</span> ادمین
              </div>
            )}
          </div>
          
          {/* Status Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {ticketData.status === 'open' && (
              <Button
                size="sm"
                onClick={() => onStatusChange(ticketData.id, 'in_progress')}
              >
                شروع بررسی
              </Button>
            )}
            {ticketData.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={() => onStatusChange(ticketData.id, 'resolved')}
              >
                حل شده
              </Button>
            )}
            {ticketData.status === 'resolved' && (
              <Button
                size="sm"
                onClick={() => onStatusChange(ticketData.id, 'closed')}
              >
                بستن تیکت
              </Button>
            )}
            {(ticketData.status === 'open' || ticketData.status === 'in_progress') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(ticketData.id, 'on_hold')}
              >
                معوق کردن
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Responses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            پاسخ‌ها و تبادل نظر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {responses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              هنوز پاسخی ثبت نشده است
            </p>
          ) : (
            <div className="space-y-4">
              {responses.map((response: any) => (
                <div key={response.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={response.senderType === 'admin' ? 'default' : 'secondary'}>
                        {response.senderType === 'admin' ? 'ادمین' : 'کاربر'}
                      </Badge>
                      <span className="font-medium">{response.senderName}</span>
                      {response.isInternal && (
                        <Badge variant="outline">داخلی</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(response.createdAt).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <p className="text-sm">{response.message}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Response Form */}
          <div className="border-t pt-4">
            <Form {...responseForm}>
              <form onSubmit={responseForm.handleSubmitranslate(onAddResponse)} className="space-y-3">
                <FormField
                  control={responseForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>پاسخ جدید</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="پاسخ خود را بنویسید..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={responseForm.control}
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
                        <FormLabel className="text-sm">یادداشت داخلی (فقط برای ادمین)</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" size="sm" className="flex items-center gap-1">
                    <Send className="w-4 h-4" />
                    ارسال پاسخ
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
      
      {/* Status History */}
      {statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              تاریخچه وضعیت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statusHistory.map((history: any) => (
                <div key={history.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {history.oldStatus && (
                      <>
                        <Badge variant="outline">{history.oldStatus}</Badge>
                        <span>→</span>
                      </>
                    )}
                    <Badge className={getStatusColor(history.newStatus)}>
                      {history.newStatus}
                    </Badge>
                    <span>توسط {history.changedByName}</span>
                    {history.reason && (
                      <span className="text-muted-foreground">({history.reason})</span>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(history.createdAt).toLocaleDateString('en-US')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}