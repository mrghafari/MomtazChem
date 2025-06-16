import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Send, 
  X, 
  User, 
  Headphones,
  Clock,
  Phone,
  Mail
} from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  sender: "customer" | "specialist";
  timestamp: Date;
  specialistName?: string;
}

interface OnlineSpecialist {
  id: string;
  name: string;
  department: string;
  status: "online" | "busy" | "away";
  expertise: string[];
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  
  // Fetch online specialists from API
  const { data: onlineSpecialists = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/specialists/online'],
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    inquiry: ""
  });
  const [currentSpecialist, setCurrentSpecialist] = useState<OnlineSpecialist | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startChat = (specialist: OnlineSpecialist) => {
    setCurrentSpecialist(specialist);
    setIsConnected(true);
    setShowContactForm(false);
    
    // Add welcome message from specialist
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `سلام! من ${specialist.name} از بخش ${specialist.department} هستم. چطور می‌تونم کمکتان کنم؟`,
      sender: "specialist",
      timestamp: new Date(),
      specialistName: specialist.name
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: "customer",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage("");

    // Simulate specialist response after a delay
    setTimeout(() => {
      const responses = [
        "ممنون از پیامتان. در حال بررسی درخواست شما هستم...",
        "این محصول را داریم. قیمت و موجودی را برایتان چک می‌کنم.",
        "برای اطلاعات بیشتر، لطفاً شماره تماستان را در اختیار قرار دهید.",
        "محصولات ما دارای گواهی کیفیت بین‌المللی هستند.",
        "می‌تونم فایل کاتالوگ محصولات رو برایتان ارسال کنم."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const specialistResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: "specialist",
        timestamp: new Date(),
        specialistName: currentSpecialist?.name
      };
      
      setMessages(prev => [...prev, specialistResponse]);
    }, 1500);
  };

  const submitContactForm = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.inquiry) return;
    
    // Find an available specialist
    const availableSpecialist = onlineSpecialists.find((s: any) => s.status === "online");
    if (availableSpecialist) {
      startChat(availableSpecialist);
      
      // Add customer info to chat
      const infoMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `نام: ${customerInfo.name}\nایمیل: ${customerInfo.email}\nتلفن: ${customerInfo.phone}\nموضوع: ${customerInfo.inquiry}`,
        sender: "customer",
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, infoMessage]);
      }, 500);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "busy": return "bg-yellow-500";
      case "away": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "آنلاین";
      case "busy": return "مشغول";
      case "away": return "غیرحاضر";
      default: return "آفلاین";
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        >
          <MessageSquare className="w-6 h-6 mr-2" />
          تماس با کارشناس
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 h-[600px] shadow-2xl">
        <CardHeader className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Headphones className="w-5 h-5 mr-2" />
              {isConnected ? `گفتگو با ${currentSpecialist?.name}` : "پشتیبانی آنلاین"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setIsConnected(false);
                setMessages([]);
                setCurrentSpecialist(null);
                setShowContactForm(false);
              }}
              className="text-white hover:bg-blue-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {isConnected && currentSpecialist && (
            <div className="mt-2 text-sm opacity-90">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(currentSpecialist.status)}`} />
                {currentSpecialist.department}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0 h-[500px] flex flex-col">
          {!isConnected && !showContactForm && (
            <div className="p-4 h-full overflow-y-auto">
              <div className="mb-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  کارشناسان آنلاین
                </h3>
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">در حال بارگذاری...</p>
                  </div>
                ) : onlineSpecialists.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">در حال حاضر کارشناسی آنلاین نیست</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetch()}
                      className="mt-2"
                    >
                      تلاش مجدد
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {onlineSpecialists.map((specialist: any) => (
                      <div key={specialist.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Avatar className="w-8 h-8 mr-2">
                              <AvatarFallback>{specialist.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{specialist.name}</div>
                              <div className="text-xs text-gray-600">{specialist.department}</div>
                            </div>
                          </div>
                          <Badge 
                            variant={specialist.status === "online" ? "default" : "secondary"}
                            className={`text-xs ${specialist.status === "online" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                          >
                            {getStatusText(specialist.status)}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          تخصص: {Array.isArray(specialist.expertise) ? specialist.expertise.join("، ") : specialist.expertise}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => specialist.status === "online" ? startChat(specialist) : setShowContactForm(true)}
                          disabled={specialist.status === "away"}
                          className="w-full"
                        >
                          {specialist.status === "online" ? "شروع گفتگو" : "درخواست تماس"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowContactForm(true)}
                  className="w-full mb-2"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  ارسال پیام
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('tel:+982144553366')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  تماس تلفنی: 44553366-021
                </Button>
              </div>
            </div>
          )}

          {showContactForm && !isConnected && (
            <div className="p-4 h-full overflow-y-auto">
              <h3 className="font-semibold mb-4">اطلاعات تماس</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">نام و نام خانوادگی</label>
                  <Input
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, name: e.target.value}))}
                    placeholder="نام کامل خود را وارد کنید"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">ایمیل</label>
                  <Input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                    placeholder="example@domain.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">شماره تماس</label>
                  <Input
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                    placeholder="09123456789"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">موضوع درخواست</label>
                  <textarea
                    value={customerInfo.inquiry}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, inquiry: e.target.value}))}
                    placeholder="لطفاً موضوع درخواست خود را شرح دهید..."
                    className="w-full p-2 border rounded-md resize-none h-24"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={submitContactForm} className="flex-1">
                    شروع گفتگو
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowContactForm(false)}
                    className="flex-1"
                  >
                    بازگشت
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isConnected && (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "customer" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === "customer"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                        <div className={`text-xs mt-1 ${
                          message.sender === "customer" ? "text-blue-100" : "text-gray-500"
                        }`}>
                          {message.sender === "specialist" && message.specialistName && (
                            <span className="mr-1">{message.specialistName} • </span>
                          )}
                          <Clock className="inline w-3 h-3 mr-1" />
                          {message.timestamp.toLocaleTimeString("fa-IR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="sm">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}