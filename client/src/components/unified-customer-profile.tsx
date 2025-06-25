import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, MapPin, Building, CreditCard, ShoppingBag, Calendar, Edit, Save, X, Eye, FileText, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UnifiedCustomerProfileProps {
  customerId: number;
  mode?: 'view' | 'edit' | 'admin';
  onUpdate?: () => void;
}

interface CustomerProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode?: string;
  alternatePhone?: string;
  state?: string;
  industry?: string;
  businessType?: string;
  companySize?: string;
  customerType: string;
  customerStatus: string;
  customerSource: string;
  totalOrdersCount: number;
  totalSpent: string;
  averageOrderValue: string;
  lastOrderDate?: string;
  firstOrderDate?: string;
  communicationPreference: string;
  preferredLanguage: string;
  marketingConsent: boolean;
  productInterests?: any[];
  creditLimit?: string;
  paymentTerms: string;
  preferredPaymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerActivity {
  id: number;
  activityType: string;
  description: string;
  performedBy: string;
  createdAt: string;
  activityData?: any;
}

interface CustomerOrder {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: string;
  paymentMethod?: string;
  carrier?: string;
  createdAt: string;
  items?: any[];
}

export default function UnifiedCustomerProfile({ customerId, mode = 'view', onUpdate }: UnifiedCustomerProfileProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [editData, setEditData] = useState<Partial<CustomerProfile>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customer profile
  const { data: customer, isLoading } = useQuery<CustomerProfile>({
    queryKey: ['/api/crm/customers', customerId],
    queryFn: async () => {
      const response = await apiRequest(`/api/crm/customers/${customerId}`, 'GET');
      return response.data;
    },
  });

  // Fetch customer activities
  const { data: activities = [] } = useQuery<CustomerActivity[]>({
    queryKey: ['/api/crm/customers', customerId, 'activities'],
    queryFn: async () => {
      const response = await apiRequest(`/api/crm/customers/${customerId}/activities`, 'GET');
      return response.data || [];
    },
  });

  // Fetch customer orders
  const { data: orders = [] } = useQuery<CustomerOrder[]>({
    queryKey: ['/api/crm/customers', customerId, 'orders'],
    queryFn: async () => {
      const response = await apiRequest(`/api/crm/customers/${customerId}/orders`, 'GET');
      return response.data || [];
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (updateData: Partial<CustomerProfile>) => {
      return apiRequest(`/api/crm/customers/${customerId}`, 'PUT', updateData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer profile updated successfully" });
      setIsEditing(false);
      setEditData({});
      queryClient.invalidateQueries({ queryKey: ['/api/crm/customers', customerId] });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update customer profile",
        variant: "destructive"
      });
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'blacklisted': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleEditChange = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateCustomerMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Customer not found</p>
      </div>
    );
  }

  const displayValue = (field: keyof CustomerProfile) => {
    if (isEditing && editData.hasOwnProperty(field)) {
      return editData[field];
    }
    return customer[field];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-gray-600">{customer.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(customer.customerStatus)}>
              {customer.customerStatus.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {customer.customerType.toUpperCase()}
            </Badge>
          </div>
        </div>
        {mode === 'admin' && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSave} 
                  disabled={updateCustomerMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <ShoppingBag className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{customer.totalOrdersCount}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.totalSpent)}</p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(customer.averageOrderValue)}</p>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer Since</Label>
                  <p className="font-medium">{formatDate(customer.createdAt)}</p>
                </div>
                {customer.lastOrderDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last Order</Label>
                    <p className="font-medium">{formatDate(customer.lastOrderDate)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-500">Source</Label>
                  <p className="font-medium capitalize">{customer.customerSource.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Payment Terms</Label>
                  <p className="font-medium capitalize">{customer.paymentTerms.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={displayValue('firstName') || ''}
                        onChange={(e) => handleEditChange('firstName', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 font-medium">{customer.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={displayValue('lastName') || ''}
                        onChange={(e) => handleEditChange('lastName', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 font-medium">{customer.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={displayValue('email') || ''}
                      onChange={(e) => handleEditChange('email', e.target.value)}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{customer.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Primary Phone *</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={displayValue('phone') || ''}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 font-medium">{customer.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="alternatePhone">Alternate Phone</Label>
                    {isEditing ? (
                      <Input
                        id="alternatePhone"
                        value={displayValue('alternatePhone') || ''}
                        onChange={(e) => handleEditChange('alternatePhone', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 font-medium">{customer.alternatePhone || 'N/A'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="communicationPreference">Communication Preference</Label>
                  {isEditing ? (
                    <Select
                      value={displayValue('communicationPreference') || 'email'}
                      onValueChange={(value) => handleEditChange('communicationPreference', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-medium capitalize">{customer.communicationPreference}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  {isEditing ? (
                    <Textarea
                      id="address"
                      value={displayValue('address') || ''}
                      onChange={(e) => handleEditChange('address', e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{customer.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    {isEditing ? (
                      <Input
                        id="city"
                        value={displayValue('city') || ''}
                        onChange={(e) => handleEditChange('city', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 font-medium">{customer.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    {isEditing ? (
                      <Input
                        id="state"
                        value={displayValue('state') || ''}
                        onChange={(e) => handleEditChange('state', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 font-medium">{customer.state || 'N/A'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    {isEditing ? (
                      <Input
                        id="country"
                        value={displayValue('country') || ''}
                        onChange={(e) => handleEditChange('country', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 font-medium">{customer.country}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    {isEditing ? (
                      <Input
                        id="postalCode"
                        value={displayValue('postalCode') || ''}
                        onChange={(e) => handleEditChange('postalCode', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 font-medium">{customer.postalCode || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Info Tab */}
        <TabsContent value="business">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  {isEditing ? (
                    <Input
                      id="company"
                      value={displayValue('company') || ''}
                      onChange={(e) => handleEditChange('company', e.target.value)}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{customer.company || 'N/A'}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    {isEditing ? (
                      <Input
                        id="industry"
                        value={displayValue('industry') || ''}
                        onChange={(e) => handleEditChange('industry', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 font-medium">{customer.industry || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="businessType">Business Type</Label>
                    {isEditing ? (
                      <Select
                        value={displayValue('businessType') || ''}
                        onValueChange={(value) => handleEditChange('businessType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="end_user">End User</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 font-medium capitalize">{customer.businessType?.replace('_', ' ') || 'N/A'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="companySize">Company Size</Label>
                  {isEditing ? (
                    <Select
                      value={displayValue('companySize') || ''}
                      onValueChange={(value) => handleEditChange('companySize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (1-50 employees)</SelectItem>
                        <SelectItem value="medium">Medium (51-250 employees)</SelectItem>
                        <SelectItem value="large">Large (251-1000 employees)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-medium capitalize">{customer.companySize || 'N/A'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  {isEditing ? (
                    <Input
                      id="creditLimit"
                      type="number"
                      step="0.01"
                      value={displayValue('creditLimit') || ''}
                      onChange={(e) => handleEditChange('creditLimit', e.target.value)}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{customer.creditLimit ? formatCurrency(customer.creditLimit) : 'N/A'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  {isEditing ? (
                    <Select
                      value={displayValue('paymentTerms') || 'immediate'}
                      onValueChange={(value) => handleEditChange('paymentTerms', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="net_30">Net 30</SelectItem>
                        <SelectItem value="net_60">Net 60</SelectItem>
                        <SelectItem value="net_90">Net 90</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-medium capitalize">{customer.paymentTerms.replace('_', ' ')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="preferredPaymentMethod">Preferred Payment Method</Label>
                  {isEditing ? (
                    <Input
                      id="preferredPaymentMethod"
                      value={displayValue('preferredPaymentMethod') || ''}
                      onChange={(e) => handleEditChange('preferredPaymentMethod', e.target.value)}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{customer.preferredPaymentMethod || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  {isEditing ? (
                    <Textarea
                      id="notes"
                      value={displayValue('notes') || ''}
                      onChange={(e) => handleEditChange('notes', e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{customer.notes || 'No notes'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Order History
              </CardTitle>
              <CardDescription>
                Complete order history for this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No orders found for this customer.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium">Order #{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                          <Badge variant="outline" className="mt-1">
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {(order.paymentMethod || order.carrier) && (
                        <div className="text-sm text-gray-600">
                          {order.paymentMethod && <span>Payment: {order.paymentMethod}</span>}
                          {order.paymentMethod && order.carrier && <span> • </span>}
                          {order.carrier && <span>Carrier: {order.carrier}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Customer Activities
              </CardTitle>
              <CardDescription>
                Timeline of all customer interactions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No activities recorded for this customer.
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border-l-4 border-blue-200 pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium capitalize">{activity.activityType.replace('_', ' ')}</h3>
                        <span className="text-sm text-gray-500">{formatDate(activity.createdAt)}</span>
                      </div>
                      <p className="text-gray-700">{activity.description}</p>
                      <p className="text-sm text-gray-500 mt-1">By: {activity.performedBy}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}