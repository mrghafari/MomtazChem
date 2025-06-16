import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, Phone, User, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface GuestUser {
  firstName: string;
  lastName: string;
  mobile: string;
  sessionId: string;
}

interface Specialist {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
  expertise: string[];
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'guest' | 'specialist';
  timestamp: Date;
  specialistName?: string;
}

export default function GuestChat() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [registrationData, setRegistrationData] = useState({
    firstName: "",
    lastName: "",
    mobile: ""
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch online specialists
  const { data: specialists = [] } = useQuery<Specialist[]>({
    queryKey: ['/api/specialists/online'],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRegistration = () => {
    if (!registrationData.firstName || !registrationData.lastName || !registrationData.mobile) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate mobile number (basic validation)
    const mobileRegex = /^[0-9]{10,11}$/;
    if (!mobileRegex.test(registrationData.mobile)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number",
        variant: "destructive",
      });
      return;
    }

    const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: GuestUser = {
      ...registrationData,
      sessionId
    };

    setGuestUser(user);
    setIsRegistered(true);
    
    // Save to localStorage for session persistence
    localStorage.setItem('guestChatUser', JSON.stringify(user));

    toast({
      title: "Registration Successful",
      description: "Welcome! Please select a specialist to start chatting.",
    });
  };

  const selectSpecialist = (specialist: Specialist) => {
    setSelectedSpecialist(specialist);
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: `Hello ${guestUser?.firstName}! I'm ${specialist.name} from ${specialist.department}. How can I help you today?`,
      sender: 'specialist',
      timestamp: new Date(),
      specialistName: specialist.name
    };
    
    setMessages([welcomeMessage]);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedSpecialist || !guestUser) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: newMessage.trim(),
      sender: 'guest',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate specialist response after a delay
    setTimeout(() => {
      const responses = [
        "Thank you for your message. Let me help you with that.",
        "I understand your concern. Could you provide more details?",
        "That's a great question. Let me check our available options for you.",
        "I'll be happy to assist you with this inquiry.",
        "Let me connect you with the right information."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const specialistMessage: ChatMessage = {
        id: `msg_${Date.now()}_specialist`,
        content: randomResponse,
        sender: 'specialist',
        timestamp: new Date(),
        specialistName: selectedSpecialist.name
      };
      
      setMessages(prev => [...prev, specialistMessage]);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Check for existing session on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('guestChatUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setGuestUser(user);
        setIsRegistered(true);
      } catch (error) {
        localStorage.removeItem('guestChatUser');
      }
    }
  }, []);

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              Start Live Chat
            </CardTitle>
            <p className="text-gray-600">
              Please provide your information to begin chatting with our specialists
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">First Name *</label>
              <Input
                type="text"
                value={registrationData.firstName}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Last Name *</label>
              <Input
                type="text"
                value={registrationData.lastName}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter your last name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Mobile Number *</label>
              <Input
                type="tel"
                value={registrationData.mobile}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="Enter your mobile number"
                className="w-full"
              />
            </div>

            <Button onClick={handleRegistration} className="w-full mt-6">
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Chat Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedSpecialist) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Welcome, {guestUser?.firstName} {guestUser?.lastName}
              </CardTitle>
              <p className="text-gray-600">
                Please select a specialist from our available team members to start your conversation
              </p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialists.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No specialists available
                  </h3>
                  <p className="text-gray-600">
                    All our specialists are currently busy. Please try again later.
                  </p>
                </CardContent>
              </Card>
            ) : (
              specialists.map((specialist) => (
                <Card 
                  key={specialist.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => selectSpecialist(specialist)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {specialist.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{specialist.name}</h3>
                        <p className="text-sm text-gray-600">{specialist.department}</p>
                      </div>
                    </div>
                    
                    <Badge 
                      variant={specialist.status === 'online' ? 'default' : 'secondary'}
                      className="mb-3"
                    >
                      {specialist.status === 'online' ? 'Available' : 'Busy'}
                    </Badge>

                    {specialist.expertise && specialist.expertise.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Expertise:</p>
                        <div className="flex flex-wrap gap-1">
                          {specialist.expertise.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button className="w-full mt-4" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {selectedSpecialist.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{selectedSpecialist.name}</h2>
              <p className="text-sm text-gray-600">{selectedSpecialist.department}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="default">Online</Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedSpecialist(null);
                setMessages([]);
              }}
            >
              Change Specialist
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col p-4">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'guest' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'guest'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}>
                  {message.sender === 'specialist' && (
                    <p className="text-xs text-gray-500 mb-1">{message.specialistName}</p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'guest' ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex space-x-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 min-h-[60px] resize-none"
                rows={2}
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}