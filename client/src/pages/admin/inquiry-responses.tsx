import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, User, Calendar, MessageSquare, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  productInterest: string;
  message: string | null;
  createdAt: string;
}

const InquiryResponses = () => {
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Fetch all contacts
  const { data: contacts, isLoading, refetch } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    }
  });

  // Send response mutation
  const sendResponseMutation = useMutation({
    mutationFn: async ({ contactId, responseMessage, customerName }: {
      contactId: number;
      responseMessage: string;
      customerName: string;
    }) => {
      return await apiRequest(`/api/contacts/${contactId}/respond`, {
        method: 'POST',
        body: { responseMessage, customerName }
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ پاسخ ارسال شد",
        description: "پاسخ شما با استفاده از Template #05 ارسال شد",
      });
      setSelectedContact(null);
      setResponseMessage("");
      setCustomerName("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا در ارسال",
        description: error.message || "امکان ارسال پاسخ وجود ندارد",
        variant: "destructive",
      });
    }
  });

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setCustomerName(`${contact.firstName} ${contact.lastName}`);
    setResponseMessage(`سلام ${contact.firstName},

از تماس شما با شرکت ممتاز شیمی سپاسگزاریم. تیم فنی ما درخواست شما را بررسی کرده و آماده ارائه اطلاعات کامل در مورد ${contact.productInterest} می‌باشیم.

ما تا 24 ساعت آینده قیمت دقیق، مشخصات فنی و موجودی محصول را برای شما ارسال خواهیم کرد.

در صورت نیاز به اطلاعات فوری، لطفاً با ما تماس بگیرید.

با احترام،
تیم فنی شرکت ممتاز شیمی`);
  };

  const handleSendResponse = () => {
    if (!selectedContact || !responseMessage.trim()) {
      toast({
        title: "⚠️ اطلاعات ناقص",
        description: "لطفاً متن پاسخ را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    sendResponseMutation.mutate({
      contactId: selectedContact.id,
      responseMessage: responseMessage.trim(),
      customerName: customerName.trim()
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">در حال بارگذاری استعلامات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📧 پاسخ به استعلامات - Template #05
          </h1>
          <p className="text-gray-600">
            ارسال پاسخ حرفه‌ای با استفاده از قالب شماره 05 (Momtaz Chemical Follow-up Response)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contacts List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                لیست استعلامات ({contacts?.length || 0})
              </CardTitle>
              <CardDescription>
                استعلام مورد نظر را برای ارسال پاسخ انتخاب کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contacts?.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedContact?.id === contact.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <User className="w-4 h-4 ml-2 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ID: {contact.id}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 ml-2" />
                        {contact.email}
                      </div>
                      {contact.company && (
                        <div className="flex items-center">
                          <Building className="w-3 h-3 ml-2" />
                          {contact.company}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 ml-2" />
                        {new Date(contact.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {contact.productInterest}
                      </Badge>
                    </div>
                    
                    {contact.message && (
                      <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                        "{contact.message}"
                      </p>
                    )}
                  </div>
                ))}
                
                {contacts?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>هیچ استعلامی ثبت نشده است</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Response Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="w-5 h-5 mr-2" />
                ارسال پاسخ با Template #05
              </CardTitle>
              <CardDescription>
                پاسخ حرفه‌ای خود را برای مشتری ارسال کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedContact ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-2">
                      استعلام انتخاب شده:
                    </h3>
                    <div className="text-sm text-blue-800">
                      <p><strong>نام:</strong> {selectedContact.firstName} {selectedContact.lastName}</p>
                      <p><strong>ایمیل:</strong> {selectedContact.email}</p>
                      <p><strong>محصول:</strong> {selectedContact.productInterest}</p>
                      {selectedContact.company && (
                        <p><strong>شرکت:</strong> {selectedContact.company}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نام مشتری
                    </label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="نام مشتری برای Template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      متن پاسخ (برای Template #05)
                    </label>
                    <Textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="متن پاسخ خود را وارد کنید..."
                      className="min-h-[300px]"
                    />
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg border">
                    <p className="text-sm text-green-800">
                      💡 <strong>نکته:</strong> متن شما در بخش "Our Response" قالب Template #05 قرار می‌گیرد
                      و با طراحی حرفه‌ای Momtaz Chemical برای مشتری ارسال می‌شود.
                    </p>
                  </div>

                  <Button
                    onClick={handleSendResponse}
                    disabled={sendResponseMutation.isPending || !responseMessage.trim()}
                    className="w-full"
                  >
                    {sendResponseMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        ارسال پاسخ با Template #05
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>لطفاً ابتدا یک استعلام از لیست انتخاب کنید</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InquiryResponses;