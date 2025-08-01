import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Eye, Mail, Calendar, User, Tag, FileText, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EmailLog {
  id: number;
  email_type: string;
  recipient_email: string;
  recipient_name: string;
  sender_email: string;
  sender_name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  template_used?: string;
  category_key?: string;
  trigger_event: string;
  related_entity_id?: string;
  delivery_status: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminEmailLogs() {
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: emailLogs, isLoading, refetch } = useQuery<{ success: boolean; logs: EmailLog[] }>({
    queryKey: ["/api/admin/email/logs"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return "✓";
      case "pending": return "⏳";
      case "failed": return "✗";
      default: return "?";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openDetailModal = async (logId: number) => {
    try {
      const response = await apiRequest(`/api/admin/email/logs/${logId}`, {
        method: "GET"
      });
      const result = await response.json();
      if (result.success) {
        setSelectedLog(result.log);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error fetching email log details:", error);
    }
  };

  const filteredLogs = emailLogs?.logs?.filter(log => {
    const matchesSearch = !searchTerm || 
      log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || log.delivery_status === statusFilter;
    const matchesType = !typeFilter || log.email_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const emailTypes = [...new Set(emailLogs?.logs?.map(log => log.email_type) || [])];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            <Mail className="inline-block w-8 h-8 ml-2" />
            لاگ ایمیل‌های اتوماتیک
          </h1>
          <Button onClick={() => refetch()} variant="outline">
            بروزرسانی
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">فیلترها و جستجو</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="جستجو در ایمیل‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="وضعیت ارسال" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="sent">ارسال شده</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="failed">ناموفق</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع ایمیل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه انواع</SelectItem>
                  {emailTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-600 flex items-center">
                <FileText className="w-4 h-4 ml-1" />
                {filteredLogs.length} ایمیل
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل ایمیل‌ها</p>
                  <p className="text-2xl font-bold">{emailLogs?.logs?.length || 0}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ارسال شده</p>
                  <p className="text-2xl font-bold text-green-600">
                    {emailLogs?.logs?.filter(log => log.delivery_status === 'sent').length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">✓</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">در انتظار</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {emailLogs?.logs?.filter(log => log.delivery_status === 'pending').length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">⏳</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ناموفق</p>
                  <p className="text-2xl font-bold text-red-600">
                    {emailLogs?.logs?.filter(log => log.delivery_status === 'failed').length || 0}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>جزئیات ایمیل‌های ارسالی</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(log.delivery_status)}>
                          {getStatusIcon(log.delivery_status)} {log.delivery_status}
                        </Badge>
                        <Badge variant="outline">{log.email_type}</Badge>
                        {log.category_key && (
                          <Badge variant="secondary">
                            <Tag className="w-3 h-3 ml-1" />
                            {log.category_key}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">گیرنده:</span>
                          <div className="text-gray-600">
                            {log.recipient_name && <div>{log.recipient_name}</div>}
                            <div>{log.recipient_email}</div>
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">موضوع:</span>
                          <div className="text-gray-600">{log.subject}</div>
                        </div>
                        
                        <div>
                          <span className="font-medium">تاریخ:</span>
                          <div className="text-gray-600 flex items-center">
                            <Calendar className="w-4 h-4 ml-1" />
                            {formatDate(log.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      {log.trigger_event && (
                        <div className="text-xs text-gray-500">
                          رویداد محرک: {log.trigger_event}
                        </div>
                      )}
                      
                      {log.error_message && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          خطا: {log.error_message}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailModal(log.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      مشاهده متن
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  هیچ ایمیل لاگ شده‌ای یافت نشد
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              جزئیات ایمیل ارسالی
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">شناسه:</span>
                    <span className="mr-2">{selectedLog.id}</span>
                  </div>
                  <div>
                    <span className="font-medium">نوع ایمیل:</span>
                    <span className="mr-2">{selectedLog.email_type}</span>
                  </div>
                  <div>
                    <span className="font-medium">فرستنده:</span>
                    <span className="mr-2">{selectedLog.sender_name} ({selectedLog.sender_email})</span>
                  </div>
                  <div>
                    <span className="font-medium">گیرنده:</span>
                    <span className="mr-2">{selectedLog.recipient_name} ({selectedLog.recipient_email})</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">موضوع:</span>
                    <span className="mr-2">{selectedLog.subject}</span>
                  </div>
                  {selectedLog.template_used && (
                    <div className="col-span-2">
                      <span className="font-medium">تمپلیت استفاده شده:</span>
                      <span className="mr-2">{selectedLog.template_used}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">محتوای ایمیل (HTML):</h4>
                  <div className="border rounded p-4 bg-gray-50 max-h-96 overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: selectedLog.html_content }} />
                  </div>
                </div>
                
                {selectedLog.text_content && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">محتوای متنی:</h4>
                    <div className="border rounded p-4 bg-gray-50 max-h-48 overflow-auto">
                      <pre className="whitespace-pre-wrap text-sm">{selectedLog.text_content}</pre>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}