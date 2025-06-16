import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Star, Phone, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: number;
  sender: string;
  senderName?: string;
  message: string;
  messageType: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatSession {
  sessionId: string;
  status: string;
  customerName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail?: string;
  isLoggedIn: boolean;
  crmCustomerId?: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  crmId?: number;
  isLoggedIn?: boolean;
}

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestFormData, setGuestFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // بررسی وضعیت لاگین مشتری
  const { data: currentCustomer } = useQuery({
    queryKey: ['/api/customers/me'],
    enabled: isOpen
  });

  // دریافت پیام‌های چت
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/live-chat/messages', sessionId],
    enabled: !!sessionId,
    refetchInterval: 2000 // به‌روزرسانی هر 2 ثانیه
  });

  // شروع جلسه چت برای مشتریان لاگین‌شده
  const continueSessionMutation = useMutation({
    mutationFn: () => apiRequest('/api/live-chat/continue-session', {
      method: 'POST'
    }),
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setCustomerInfo(data.customer);
      setShowGuestForm(false);
      toast({
        title: "چت شروع شد",
        description: data.message
      });
    },
    onError: (error: any) => {
      console.error('Continue session error:', error);
      setShowGuestForm(true);
    }
  });

  // شروع جلسه چت برای مشتریان غیر لاگین
  const startSessionMutation = useMutation({
    mutationFn: (formData: typeof guestFormData) => 
      apiRequest('/api/live-chat/start-session', {
        method: 'POST',
        body: JSON.stringify(formData)
      }),
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setCustomerInfo(data.customer);
      setShowGuestForm(false);
      toast({
        title: "چت شروع شد",
        description: data.message
      });
    }
  });

  // ارسال پیام
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => 
      apiRequest('/api/live-chat/send-message', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          message,
          sender: 'customer'
        })
      }),
    onSuccess: () => {
      setCurrentMessage('');
      refetchMessages();
    }
  });

  // پایان جلسه چت
  const endSessionMutation = useMutation({
    mutationFn: () => 
      apiRequest('/api/live-chat/end-session', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          rating: rating > 0 ? rating : undefined,
          feedback: feedback.trim() || undefined
        })
      }),
    onSuccess: () => {
      setSessionId(null);
      setCustomerInfo(null);
      setShowRatingForm(false);
      setRating(0);
      setFeedback('');
      toast({
        title: "جلسه چت پایان یافت",
        description: "از شما برای استفاده از خدمات ما متشکریم"
      });
    }
  });

  // اسکرول خودکار به انتهای پیام‌ها
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  // شروع چت
  const handleStartChat = () => {
    if (currentCustomer?.success && currentCustomer.customer) {
      // مشتری لاگین‌شده است
      continueSessionMutation.mutate();
    } else {
      // نمایش فرم برای مشتری غیر لاگین
      setShowGuestForm(true);
    }
  };

  // ارسال فرم مشتری غیر لاگین
  const handleGuestFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestFormData.firstName || !guestFormData.lastName || !guestFormData.phone) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای الزامی را پر کنید",
        variant: "destructive"
      });
      return;
    }
    startSessionMutation.mutate(guestFormData);
  };

  // ارسال پیام
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !sessionId) return;
    sendMessageMutation.mutate(currentMessage);
  };

  // پایان چت با نمایش فرم ارزیابی
  const handleEndChat = () => {
    setShowRatingForm(true);
  };

  // ارسال ارزیابی و پایان جلسه
  const handleSubmitRating = () => {
    endSessionMutation.mutate();
  };

  const messages = messagesData?.messages || [];

  return (
    <>
      {/* دکمه شناور چت */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      )}

      {/* پنجره چت */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">چت پشتیبانی</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {customerInfo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{customerInfo.name}</span>
                {customerInfo.isLoggedIn && (
                  <Badge variant="secondary" className="text-xs">وارد شده</Badge>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-4 space-y-4">
            {!sessionId && !showGuestForm && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <MessageCircle className="w-16 h-16 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold mb-2">چت با پشتیبانی</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    یکی از کارشناسان ما آماده پاسخگویی به سوالات شماست
                  </p>
                  <Button 
                    onClick={handleStartChat}
                    disabled={continueSessionMutation.isPending}
                    className="w-full"
                  >
                    {continueSessionMutation.isPending ? 'در حال شروع...' : 'شروع چت'}
                  </Button>
                </div>
              </div>
            )}

            {showGuestForm && (
              <form onSubmit={handleGuestFormSubmit} className="flex-1 space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">اطلاعات تماس</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    لطفاً اطلاعات زیر را برای شروع چت وارد کنید
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Input
                      placeholder="نام *"
                      value={guestFormData.firstName}
                      onChange={(e) => setGuestFormData(prev => ({
                        ...prev,
                        firstName: e.target.value
                      }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Input
                      placeholder="نام خانوادگی *"
                      value={guestFormData.lastName}
                      onChange={(e) => setGuestFormData(prev => ({
                        ...prev,
                        lastName: e.target.value
                      }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Input
                      placeholder="شماره تلفن *"
                      value={guestFormData.phone}
                      onChange={(e) => setGuestFormData(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Input
                      placeholder="ایمیل (اختیاری)"
                      type="email"
                      value={guestFormData.email}
                      onChange={(e) => setGuestFormData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  disabled={startSessionMutation.isPending}
                  className="w-full"
                >
                  {startSessionMutation.isPending ? 'در حال شروع...' : 'شروع چت'}
                </Button>
              </form>
            )}

            {sessionId && !showRatingForm && (
              <>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-3">
                    {messages.map((message: ChatMessage) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.sender === 'customer'
                              ? 'bg-blue-600 text-white'
                              : message.sender === 'system'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {message.senderName && message.sender !== 'customer' && (
                              <span className="text-xs opacity-70">
                                {message.senderName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="space-y-2">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="پیام خود را بنویسید..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button 
                      type="submit"
                      disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEndChat}
                    className="w-full"
                  >
                    پایان چت
                  </Button>
                </div>
              </>
            )}

            {showRatingForm && (
              <div className="flex-1 space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">ارزیابی چت</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    لطفاً کیفیت خدمات ما را ارزیابی کنید
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">امتیاز (1-5):</label>
                    <div className="flex justify-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          variant="ghost"
                          size="sm"
                          onClick={() => setRating(star)}
                          className="p-1"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`} 
                          />
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">نظر شما (اختیاری):</label>
                    <textarea
                      placeholder="نظر خود را بنویسید..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full mt-2 p-2 border rounded-md text-sm"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitRating}
                    disabled={endSessionMutation.isPending}
                    className="flex-1"
                  >
                    {endSessionMutation.isPending ? 'در حال ارسال...' : 'ارسال ارزیابی'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => endSessionMutation.mutate()}
                    disabled={endSessionMutation.isPending}
                  >
                    رد کردن
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default LiveChatWidget;