import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Clock, Eye, Search, Filter, Calendar, User, MessageSquare, AlertCircle, CheckCircle, XCircle, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmailLog {
  id: number;
  email_type: string;
  recipient_email: string;
  recipient_name?: string;
  sender_email: string;
  sender_name?: string;
  subject: string;
  html_content?: string;
  text_content?: string;
  template_used?: string;
  category_key?: string;
  trigger_event?: string;
  related_entity_id?: string;
  delivery_status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  sent_at: string;
  created_at: string;
  updated_at?: string;
}

export default function AutomatedEmailLogsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showEmailContent, setShowEmailContent] = useState(false);

  // Language-based text content
  const getText = (key: string) => {
    const texts = {
      title: {
        en: "Automated Email Logs",
        ar: "سجلات البريد الإلكتروني التلقائي",
        ku: "تۆمارەکانی ئیمەیڵی خودکار",
        tr: "Otomatik E-posta Günlükleri"
      },
      subtitle: {
        en: "View and manage all emails sent by the system",
        ar: "عرض وإدارة جميع الرسائل الإلكترونية المرسلة من النظام",
        ku: "بینین و بەڕێوەبردنی هەموو ئیمەیڵەکانی ناردراو لەلایەن سیستەمەوە",
        tr: "Sistem tarafından gönderilen tüm e-postaları görüntüle ve yönet"
      },
      backButton: {
        en: "Back to Email Settings",
        ar: "العودة إلى إعدادات البريد الإلكتروني",
        ku: "گەڕانەوە بۆ ڕێکخستنەکانی ئیمەیڵ",
        tr: "E-posta Ayarlarına Dön"
      },
      refresh: {
        en: "Refresh",
        ar: "تحديث",
        ku: "نوێکردنەوە",
        tr: "Yenile"
      },
      filterTitle: {
        en: "Filter and Search",
        ar: "تصفية وبحث",
        ku: "فیلتەر و گەڕان",
        tr: "Filtrele ve Ara"
      },
      searchPlaceholder: {
        en: "Search in email, subject or recipient...",
        ar: "البحث في البريد الإلكتروني أو الموضوع أو المستلم...",
        ku: "گەڕان لە ئیمەیڵ، بابەت یان وەرگر...",
        tr: "E-posta, konu veya alıcıda ara..."
      },
      statusLabel: {
        en: "Status",
        ar: "الحالة",
        ku: "دۆخ",
        tr: "Durum"
      },
      categoryLabel: {
        en: "Category",
        ar: "الفئة",
        ku: "پۆل",
        tr: "Kategori"
      },
      allStatuses: {
        en: "All Statuses",
        ar: "جميع الحالات",
        ku: "هەموو دۆخەکان",
        tr: "Tüm Durumlar"
      },
      allCategories: {
        en: "All Categories",
        ar: "جميع الفئات",
        ku: "هەموو پۆلەکان",
        tr: "Tüm Kategoriler"
      },
      clearFilters: {
        en: "Clear Filters",
        ar: "مسح المرشحات",
        ku: "پاککردنەوەی فیلتەرەکان",
        tr: "Filtreleri Temizle"
      },
      totalEmails: {
        en: "Total Emails",
        ar: "إجمالي الرسائل الإلكترونية",
        ku: "کۆی گشتی ئیمەیڵەکان",
        tr: "Toplam E-postalar"
      },
      successfulSent: {
        en: "Successfully Sent",
        ar: "تم الإرسال بنجاح",
        ku: "بە سەرکەوتوویی نێردراوە",
        tr: "Başarıyla Gönderildi"
      },
      failedSent: {
        en: "Failed to Send",
        ar: "فشل في الإرسال",
        ku: "شکستی هێناوە لە ناردن",
        tr: "Gönderim Başarısız"
      },
      pending: {
        en: "Pending",
        ar: "في الانتظار",
        ku: "چاوەڕوان",
        tr: "Beklemede"
      },
      emailList: {
        en: "Automated Email List",
        ar: "قائمة الرسائل الإلكترونية التلقائية",
        ku: "لیستی ئیمەیڵی خودکار",
        tr: "Otomatik E-posta Listesi"
      },
      noEmailsFound: {
        en: "No emails found",
        ar: "لم يتم العثور على رسائل إلكترونية",
        ku: "هیچ ئیمەیڵێک نەدۆزرایەوە",
        tr: "E-posta bulunamadı"
      },
      emailDetails: {
        en: "Email Details",
        ar: "تفاصيل البريد الإلكتروني",
        ku: "وردەکارییەکانی ئیمەیڵ",
        tr: "E-posta Detayları"
      },
      sender: {
        en: "Sender",
        ar: "المرسل",
        ku: "ناردەر",
        tr: "Gönderen"
      },
      recipient: {
        en: "Recipient",
        ar: "المستلم",
        ku: "وەرگر",
        tr: "Alıcı"
      },
      recipients: {
        en: "Email Recipients",
        ar: "مستلمو البريد الإلكتروني",
        ku: "وەرگرانی ئیمەیڵ",
        tr: "E-posta Alıcıları"
      },
      subject: {
        en: "Subject",
        ar: "الموضوع",
        ku: "بابەت",
        tr: "Konu"
      },
      sentTime: {
        en: "Sent Time",
        ar: "وقت الإرسال",
        ku: "کاتی ناردن",
        tr: "Gönderim Zamanı"
      },
      templateUsed: {
        en: "Template Used",
        ar: "القالب المستخدم",
        ku: "قاڵبی بەکارهێنراو",
        tr: "Kullanılan Şablon"
      },
      retryCount: {
        en: "Retry Count",
        ar: "عدد المحاولات",
        ku: "ژمارەی هەوڵەکان",
        tr: "Deneme Sayısı"
      },
      errorMessage: {
        en: "Error Message",
        ar: "رسالة الخطأ",
        ku: "پەیامی هەڵە",
        tr: "Hata Mesajı"
      },
      emailContent: {
        en: "Email Content",
        ar: "محتوى البريد الإلكتروني",
        ku: "ناوەڕۆکی ئیمەیڵ",
        tr: "E-posta İçeriği"
      },
      emailContentPreview: {
        en: "Email Content Preview (As Customer Sees)",
        ar: "معاينة محتوى البريد الإلكتروني (كما يراه العميل)",
        ku: "پیشاندانی ناوەڕۆکی ئیمەیڵ (وەک کڕیار دەیبینێت)",
        tr: "E-posta İçerik Önizlemesi (Müşterinin Gördüğü Gibi)"
      },
      showEmailContent: {
        en: "Show Email Content",
        ar: "إظهار محتوى البريد الإلكتروني",
        ku: "پیشاندانی ناوەڕۆکی ئیمەیڵ",
        tr: "E-posta İçeriğini Göster"
      },
      hideEmailContent: {
        en: "Hide Email Content",
        ar: "إخفاء محتوى البريد الإلكتروني",
        ku: "شاردنەوەی ناوەڕۆکی ئیمەیڵ",
        tr: "E-posta İçeriğini Gizle"
      },
      noContentAvailable: {
        en: "Email content not available",
        ar: "محتوى البريد الإلكتروني غير متاح",
        ku: "ناوەڕۆکی ئیمەیڵ بەردەست نییە",
        tr: "E-posta içeriği mevcut değil"
      },
      copyContent: {
        en: "Copy Content",
        ar: "نسخ المحتوى",
        ku: "کۆپیکردنی ناوەڕۆک",
        tr: "İçeriği Kopyala"
      },
      selectEmail: {
        en: "Select an email",
        ar: "اختر بريد إلكتروني",
        ku: "ئیمەیڵێک هەڵبژێرە",
        tr: "Bir e-posta seçin"
      },
      copied: {
        en: "Copied",
        ar: "تم النسخ",
        ku: "کۆپیکرا",
        tr: "Kopyalandı"
      },
      contentCopied: {
        en: "Email content copied",
        ar: "تم نسخ محتوى البريد الإلكتروني",
        ku: "ناوەڕۆکی ئیمەیڵ کۆپیکرا",
        tr: "E-posta içeriği kopyalandı"
      }
    };
    
    return (texts as any)[key]?.[language] || (texts as any)[key]?.en || key;
  };

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

  // Fetch email logs
  const { data: emailLogsResponse, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/email/logs"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const emailLogs: EmailLog[] = (emailLogsResponse as any)?.logs || [];
  
  // Debug logging
  console.log('📧 [Email Logs Debug]', {
    isLoading,
    hasResponse: !!emailLogsResponse,
    responseType: typeof emailLogsResponse,
    logsCount: emailLogs.length,
    firstLog: emailLogs[0],
    rawResponse: emailLogsResponse
  });

  // Filter logs based on search and filters
  const filteredLogs = emailLogs.filter((log) => {
    const matchesSearch = log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.email_type && log.email_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (log.category_key && log.category_key.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || log.delivery_status === statusFilter;
    const matchesCategory = categoryFilter === "all" || log.email_type === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(emailLogs.map(log => log.email_type).filter(Boolean)));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800"
    };
    
    const getStatusLabel = (status: string) => {
      const labels = {
        sent: {
          en: "Sent",
          ar: "مرسل",
          ku: "نێردراوە",
          tr: "Gönderildi"
        },
        failed: {
          en: "Failed",
          ar: "فاشل",
          ku: "شکستخواردوو",
          tr: "Başarısız"
        },
        pending: {
          en: "Pending",
          ar: "في الانتظار",
          ku: "چاوەڕوان",
          tr: "Beklemede"
        }
      };
      return (labels as any)[status]?.[language] || (labels as any)[status]?.en || status;
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locales = {
      en: 'en-US',
      ar: 'ar-SA',
      ku: 'en-US', // Kurdish uses English format
      tr: 'tr-TR'
    };
    
    return new Intl.DateTimeFormat(locales[language] || 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      "admin": "bg-blue-100 text-blue-800",
      "fuel-additives": "bg-orange-100 text-orange-800",
      "water-treatment": "bg-cyan-100 text-cyan-800", 
      "agricultural-fertilizers": "bg-green-100 text-green-800",
      "paint-thinner": "bg-purple-100 text-purple-800",
      "orders": "bg-yellow-100 text-yellow-800",
      "notifications": "bg-gray-100 text-gray-800",
      "password-reset": "bg-red-100 text-red-800",
      "inventory-alerts": "bg-amber-100 text-amber-800",
      "system-notifications": "bg-slate-100 text-slate-800"
    };
    
    return (
      <Badge className={colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {category}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">
            {language === 'ar' ? 'جاري تحميل سجلات البريد الإلكتروني...' :
             language === 'ku' ? 'بارکردنی تۆمارەکانی ئیمەیڵ...' :
             language === 'tr' ? 'E-posta günlükleri yükleniyor...' :
             'Loading email logs...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => setLocation("/admin/advanced-email-settings")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {getText('backButton')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{getText('title')}</h1>
          <p className="text-gray-600 mt-1">{getText('subtitle')}</p>
        </div>
        <div className="flex-1"></div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {getText('refresh')}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {getText('filterTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{getText('searchPlaceholder').split(' ')[0]}</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={getText('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">{getText('statusLabel')}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={getText('statusLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getText('allStatuses')}</SelectItem>
                  <SelectItem value="sent">{getText('successfulSent')}</SelectItem>
                  <SelectItem value="failed">{getText('failedSent')}</SelectItem>
                  <SelectItem value="pending">{getText('pending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{getText('categoryLabel')}</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={getText('categoryLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getText('allCategories')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="w-full"
              >
                {getText('clearFilters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{getText('totalEmails')}</p>
                <p className="text-2xl font-bold">{emailLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{getText('successfulSent')}</p>
                <p className="text-2xl font-bold">{emailLogs.filter(log => log.delivery_status === 'sent').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{getText('failedSent')}</p>
                <p className="text-2xl font-bold">{emailLogs.filter(log => log.delivery_status === 'failed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{getText('pending')}</p>
                <p className="text-2xl font-bold">{emailLogs.filter(log => log.delivery_status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Logs List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {getText('emailList')} ({filteredLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {getText('noEmailsFound')}
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedLog?.id === log.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(log.delivery_status)}
                            <span className="font-medium text-sm">{log.recipient_email}</span>
                            {getStatusBadge(log.delivery_status)}
                            {log.email_type && getCategoryBadge(log.email_type)}
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{log.subject}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(log.sent_at)}
                            {log.template_used && (
                              <span className="ml-2">• {getText('templateUsed')}: {log.template_used}</span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                            setShowEmailContent(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {getText('emailDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLog ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">{getText('sender')}</label>
                    <p className="text-sm bg-blue-50 p-2 rounded mt-1 text-blue-800">
                      <strong>FROM:</strong> {selectedLog.sender_name || selectedLog.sender_email} &lt;{selectedLog.sender_email}&gt;
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">{getText('recipients')}</label>
                    <div className="space-y-2 mt-1">
                      <p className="text-sm bg-green-50 p-2 rounded text-green-800">
                        <strong>TO:</strong> {selectedLog.recipient_name ? `${selectedLog.recipient_name} <${selectedLog.recipient_email}>` : selectedLog.recipient_email}
                      </p>
                      <p className="text-sm bg-yellow-50 p-2 rounded text-yellow-800">
                        <strong>CC:</strong> info@momtazchem.com (automatic archive)
                      </p>
                      {selectedLog.category_key && selectedLog.category_key !== 'admin' && (
                        <p className="text-sm bg-orange-50 p-2 rounded text-orange-800">
                          <strong>BCC:</strong> {selectedLog.sender_email !== 'info@momtazchem.com' ? 'info@momtazchem.com (monitoring)' : 'No additional BCC'}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 italic">
                        * All automated emails include CC to info@momtazchem.com for archival purposes
                        {selectedLog.category_key && selectedLog.category_key !== 'admin' && ' and monitoring'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">{getText('subject')}</label>
                    <p className="text-sm bg-gray-50 p-2 rounded mt-1">{selectedLog.subject}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">{getText('categoryLabel')}</label>
                    <div className="mt-1">{selectedLog.email_type && getCategoryBadge(selectedLog.email_type)}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">{getText('statusLabel')}</label>
                    <div className="mt-1">{getStatusBadge(selectedLog.delivery_status)}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">{getText('sentTime')}</label>
                    <p className="text-sm bg-gray-50 p-2 rounded mt-1">{formatDate(selectedLog.sent_at)}</p>
                  </div>

                  {selectedLog.template_used && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">{getText('templateUsed')}</label>
                      <p className="text-sm bg-gray-50 p-2 rounded mt-1">{selectedLog.template_used}</p>
                    </div>
                  )}

                  {selectedLog.error_message && (
                    <div>
                      <label className="text-sm font-medium text-red-700">{getText('errorMessage')}</label>
                      <p className="text-sm bg-red-50 p-2 rounded mt-1 text-red-700">{selectedLog.error_message}</p>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <Button
                      variant={showEmailContent ? "default" : "outline"}
                      className="w-full mb-3"
                      onClick={() => setShowEmailContent(!showEmailContent)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showEmailContent ? getText('hideEmailContent') : getText('showEmailContent')}
                    </Button>
                    
                    {showEmailContent && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">{getText('emailContentPreview')}</label>
                        {selectedLog.html_content ? (
                          <div 
                            className="border rounded-lg p-4 bg-white min-h-[300px] max-h-[500px] overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: selectedLog.html_content }}
                            style={{ direction: 'ltr' }}
                          />
                        ) : (
                          <Textarea
                            value={selectedLog.text_content || getText('noContentAvailable')}
                            readOnly
                            className="min-h-[200px] text-sm"
                            style={{ direction: 'ltr' }}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {showEmailContent && (
                    <Button
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedLog.html_content || selectedLog.text_content || "");
                        toast({
                          title: getText('copied'),
                          description: getText('contentCopied')
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {getText('copyContent')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {getText('selectEmail')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}