import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  MessageSquare,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  Package,
  AlertCircle,
  User,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface Inquiry {
  id: number;
  inquiryNumber: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  subject: string;
  message: string;
  type: string;
  priority: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  productIds?: number[];
}

interface InquiryResponse {
  id: number;
  inquiryId: number;
  senderId: number;
  senderType: string;
  message: string;
  attachments?: any;
  isInternal: boolean;
  readAt?: string;
  createdAt: string;
}

const InquiryDetail = () => {
  const [location] = useLocation();
  const inquiryId = location.split('/')[3]; // Get ID from /admin/inquiry/123
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dialogs
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [isProductsDialogOpen, setIsProductsDialogOpen] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth');
        if (!response.ok) {
          window.location.href = '/admin/login';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/admin/login';
      }
    };
    checkAuth();
  }, []);

  const { data: inquiry, isLoading } = useQuery<Inquiry>({
    queryKey: ["/api/inquiries", inquiryId],
    queryFn: () => fetch(`/api/inquiries/${inquiryId}`).then(res => res.json()),
    enabled: !!inquiryId,
  });

  const { data: responses } = useQuery<InquiryResponse[]>({
    queryKey: ["/api/inquiries", inquiryId, "responses"],
    queryFn: () => fetch(`/api/inquiries/${inquiryId}/responses`).then(res => res.json()),
    enabled: !!inquiryId,
  });

  // Mutation for updating inquiry status
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/inquiries/${inquiryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('مشکلی در به‌روزرسانی وضعیت پیش آمد');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries", inquiryId] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({
        title: "موفقیت",
        description: "وضعیت استعلام با موفقیت به‌روزرسانی شد",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطا",
        description: error.message || "مشکلی در به‌روزرسانی وضعیت پیش آمد",
        variant: "destructive"
      });
    }
  });

  // Handler for sending follow-up
  const handleSendFollowUp = async () => {
    if (!followUpMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a follow-up message",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responseText: followUpMessage
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Follow-up sent successfully",
        });
        setFollowUpMessage('');
        setIsFollowUpDialogOpen(false);
        // Refresh the responses
        window.location.reload();
      } else {
        throw new Error('Failed to send follow-up');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send follow-up message",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for viewing related products
  const handleViewRelatedProducts = () => {
    // Navigate to products page with category filter
    const category = inquiry?.category || '';
    window.open(`/products?category=${encodeURIComponent(category)}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Inquiry Not Found</h1>
            <Link href="/admin/inquiries">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/inquiries">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{inquiry.subject}</h1>
              <p className="text-gray-600">Inquiry #{inquiry.inquiryNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(inquiry.status)}>
                {getStatusIcon(inquiry.status)}
                <span className="ml-1">{inquiry.status.replace('_', ' ')}</span>
              </Badge>
              <Badge className={getPriorityColor(inquiry.priority)}>
                {inquiry.priority}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Inquiry Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Inquiry Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Subject</h4>
                  <p className="text-gray-700">{inquiry.subject}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Message</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Type</h4>
                    <p className="text-gray-700">{inquiry.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Category</h4>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{inquiry.category.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Responses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Responses ({responses?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {responses && responses.length > 0 ? (
                  <div className="space-y-4">
                    {responses.map((response, index) => (
                      <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">Support Team</span>
                            <Badge variant="outline" className="text-xs">
                              {response.senderType}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {format(new Date(response.createdAt), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No responses yet</p>
                    <p className="text-sm text-gray-400">We'll respond within 24 hours</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{inquiry.contactEmail}</span>
                </div>
                
                {inquiry.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{inquiry.contactPhone}</span>
                  </div>
                )}
                
                {inquiry.company && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{inquiry.company}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(inquiry.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(inquiry.updatedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsFollowUpDialogOpen(true)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Follow-up
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleViewRelatedProducts}
                >
                  <Package className="h-4 w-4 mr-2" />
                  View Related Products
                </Button>
                
                {/* Status Update Buttons */}
                {inquiry?.status === 'open' && (
                  <Button 
                    variant="outline" 
                    className="w-full bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-800"
                    onClick={() => updateStatusMutation.mutate('in_progress')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {updateStatusMutation.isPending ? 'در حال به‌روزرسانی...' : 'شروع بررسی'}
                  </Button>
                )}
                
                {inquiry?.status === 'in_progress' && (
                  <Button 
                    variant="outline" 
                    className="w-full bg-green-50 hover:bg-green-100 border-green-300 text-green-800"
                    onClick={() => updateStatusMutation.mutate('resolved')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updateStatusMutation.isPending ? 'در حال به‌روزرسانی...' : 'حل شده'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Follow-up Dialog */}
      <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Follow-up
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="follow-up-message">Follow-up Message *</Label>
              <Textarea
                id="follow-up-message"
                value={followUpMessage}
                onChange={(e) => setFollowUpMessage(e.target.value)}
                placeholder="Enter your follow-up message for the customer..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFollowUpDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendFollowUp} 
                disabled={isSubmitting} 
                className="flex-1"
              >
                {isSubmitting ? "Sending..." : "Send Follow-up"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InquiryDetail;