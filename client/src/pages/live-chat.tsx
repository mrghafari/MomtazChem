import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageCircle, 
  Send, 
  User, 
  Phone,
  UserCheck,
  Clock,
  CheckCircle
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: 'customer' | 'specialist';
  message: string;
  timestamp: Date;
  specialistName?: string;
}

interface ChatSession {
  id: string;
  customerName: string;
  customerPhone: string;
  specialistId?: string;
  specialistName?: string;
  status: 'waiting' | 'connected' | 'ended';
  messages: ChatMessage[];
  startedAt: Date;
}

interface CustomerInfo {
  id?: number;
  firstName: string;
  lastName: string;
  phone: string;
  foundInCrm: boolean;
  crmName?: string;
}

export default function LiveChat() {
  const [step, setStep] = useState<'form' | 'waiting' | 'chatting'>('form');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    foundInCrm: false
  });
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [onlineSpecialists, setOnlineSpecialists] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check if user is logged in
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/customers/me"],
    retry: false,
  });

  // Auto-skip form for logged-in users
  useEffect(() => {
    if (currentUser && !isUserLoading) {
      // User is logged in, skip form and use their info
      setCustomerInfo({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phone: currentUser.phone || '',
        foundInCrm: true,
        crmName: `${currentUser.firstName} ${currentUser.lastName}`
      });
      // Skip directly to waiting for specialist
      handleStartChat();
    }
  }, [currentUser, isUserLoading]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Immediate scroll without animation to prevent jumping
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 10);
    
    return () => clearTimeout(timer);
  }, [chatSession?.messages]);

  // Load online specialists
  useEffect(() => {
    const fetchOnlineSpecialists = async () => {
      try {
        const response = await fetch('/api/specialists/online');
        if (response.ok) {
          const specialists = await response.json();
          setOnlineSpecialists(specialists);
        }
      } catch (error) {
        console.error('Error fetching specialists:', error);
      }
    };

    fetchOnlineSpecialists();
    const interval = setInterval(fetchOnlineSpecialists, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Check if phone number exists in CRM
  const checkPhoneInCrm = async (phone: string) => {
    setIsCheckingPhone(true);
    try {
      const response = await fetch(`/api/crm/customers/search?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();
      
      if (response.ok && data.length > 0) {
        const customer = data[0];
        return {
          found: true,
          crmName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
          customerId: customer.id
        };
      }
      return { found: false };
    } catch (error) {
      console.error('Error checking phone in CRM:', error);
      return { found: false };
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Handle form submission
  const handleStartChat = async () => {
    if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim() || !customerInfo.phone.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check phone in CRM
    const crmCheck = await checkPhoneInCrm(customerInfo.phone);
    
    const updatedCustomerInfo = {
      ...customerInfo,
      foundInCrm: crmCheck.found,
      crmName: crmCheck.crmName,
      id: crmCheck.customerId
    };
    
    setCustomerInfo(updatedCustomerInfo);

    // Create chat session
    const session: ChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerName: crmCheck.found ? crmCheck.crmName! : `${customerInfo.firstName} ${customerInfo.lastName}`,
      customerPhone: customerInfo.phone,
      status: 'waiting',
      messages: [],
      startedAt: new Date()
    };

    setChatSession(session);
    setStep('waiting');

    // Show CRM result
    if (crmCheck.found) {
      toast({
        title: "Customer Found",
        description: `Welcome back, ${crmCheck.crmName}! You are now in the chat queue.`,
      });
    } else {
      toast({
        title: "New Customer",
        description: "You are now in the chat queue. A specialist will be with you shortly.",
      });
    }

    // Simulate specialist assignment (in real app, this would be handled by backend)
    setTimeout(() => {
      if (onlineSpecialists.length > 0) {
        const specialist = onlineSpecialists[0];
        setChatSession(prev => prev ? {
          ...prev,
          specialistId: specialist.id,
          specialistName: specialist.name,
          status: 'connected',
          messages: [{
            id: `msg_${Date.now()}`,
            sender: 'specialist',
            message: `Hello ${session.customerName}! I'm ${specialist.name} and I'll be assisting you today. How can I help you?`,
            timestamp: new Date(),
            specialistName: specialist.name
          }]
        } : null);
        setStep('chatting');
        
        toast({
          title: "Connected",
          description: `You are now connected with ${specialist.name}`,
        });
      }
    }, 2000);
  };

  // Send message
  const sendMessage = () => {
    if (!currentMessage.trim() || !chatSession) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: 'customer',
      message: currentMessage.trim(),
      timestamp: new Date()
    };

    // Clear input immediately to prevent any UI lag
    setCurrentMessage('');

    setChatSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage]
    } : null);

    // Scroll to bottom immediately after sending
    setTimeout(() => {
      scrollToBottom();
    }, 0);

    // Simulate specialist response (in real app, this would be real-time)
    setTimeout(() => {
      const responses = [
        "Thank you for your message. Let me help you with that.",
        "I understand your concern. Could you provide more details?",
        "Let me check that for you right away.",
        "That's a great question. Here's what I can tell you...",
        "I'll be happy to assist you with this matter."
      ];
      
      const response: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: 'specialist',
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        specialistName: chatSession.specialistName
      };

      setChatSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, response]
      } : null);
    }, 1000 + Math.random() * 2000);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Customer information form
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Live Chat Support</CardTitle>
            <p className="text-gray-600 mt-2">
              Please provide your information to start chatting with our specialists
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <Input
                value={customerInfo.firstName}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
                disabled={isCheckingPhone}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <Input
                value={customerInfo.lastName}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter your last name"
                disabled={isCheckingPhone}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Mobile Number</label>
              <Input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
                disabled={isCheckingPhone}
              />
            </div>

            <Button 
              onClick={handleStartChat} 
              className="w-full" 
              disabled={isCheckingPhone}
            >
              {isCheckingPhone ? 'Checking...' : 'Start Chat'}
            </Button>

            {onlineSpecialists.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>{onlineSpecialists.length} specialist{onlineSpecialists.length > 1 ? 's' : ''} online</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting for specialist
  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Connecting...</CardTitle>
            <p className="text-gray-600 mt-2">
              Please wait while we connect you with a specialist
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-bounce w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="animate-bounce w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: '0.1s' }}></div>
              <div className="animate-bounce w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Customer Information:</p>
              <div className="bg-gray-50 p-3 rounded-lg text-left">
                <p><strong>Name:</strong> {customerInfo.foundInCrm ? customerInfo.crmName : `${customerInfo.firstName} ${customerInfo.lastName}`}</p>
                <p><strong>Phone:</strong> {customerInfo.phone}</p>
                {customerInfo.foundInCrm && (
                  <div className="flex items-center gap-2 mt-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">Found in CRM</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Chat header */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Live Chat Support</h1>
              <p className="text-sm text-gray-600">
                Connected with {chatSession?.specialistName}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Online
          </Badge>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 overflow-hidden">
        <div className="h-[calc(100vh-200px)] bg-white rounded-lg border flex flex-col">
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {chatSession?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'customer'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {message.sender === 'specialist' && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {message.specialistName}
                      </p>
                    )}
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Message input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex space-x-3">
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!currentMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}