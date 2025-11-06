import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MapPin, Check, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomerAddress {
  id: number;
  customerId: number;
  title: string;
  recipientName: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  country: string;
  state?: string;
  city: string;
  address: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddressFormData {
  title: string;
  recipientName: string;
  company?: string;
  phone: string;
  country: string;
  state?: string;
  city: string;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
}

interface AddressSelectorProps {
  selectedAddressId?: number;
  onAddressSelect: (address: CustomerAddress) => void;
}

export default function AddressSelector({ selectedAddressId, onAddressSelect }: AddressSelectorProps) {
  const { t, direction } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>({
    title: '',
    recipientName: '',
    company: '',
    phone: '',
    country: t.address_selector.defaultCountry,
    state: '',
    city: '',
    address: '',
    postalCode: '',
    latitude: undefined,
    longitude: undefined,
    locationAccuracy: undefined
  });

  // Fetch customer addresses
  const { data: addressesResponse, isLoading } = useQuery({
    queryKey: ['/api/customers/addresses'],
    queryFn: async () => {
      const response = await fetch('/api/customers/addresses', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(t.address_selector.fetchAddressesError);
      return response.json();
    }
  });

  // Fetch customer info for default recipient name
  const { data: customerInfo } = useQuery({
    queryKey: ['/api/customers/profile'],
    queryFn: async () => {
      const response = await fetch('/api/customers/profile', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(t.address_selector.fetchCustomerInfoError);
      return response.json();
    }
  });

  const addresses = addressesResponse?.addresses || [];

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: t.address_selector.locationError,
        description: t.address_selector.browserNotSupported,
        variant: 'destructive'
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
          locationAccuracy: accuracy
        }));
        toast({
          title: t.address_selector.locationReceived,
          description: t.address_selector.locationReceivedDesc.replace('{accuracy}', Math.round(accuracy).toString())
        });
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = t.address_selector.locationError;
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = t.address_selector.locationPermissionDenied;
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = t.address_selector.locationUnavailable;
        } else if (error.code === error.TIMEOUT) {
          errorMessage = t.address_selector.locationTimeout;
        }
        
        toast({
          title: t.address_selector.locationError,
          description: errorMessage,
          variant: 'destructive'
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Set default recipient name when opening add new address dialog
  useEffect(() => {
    if (isDialogOpen && !editingAddress && customerInfo) {
      const defaultRecipientName = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim();
      if (defaultRecipientName && !formData.recipientName) {
        setFormData(prev => ({
          ...prev,
          recipientName: defaultRecipientName,
          phone: customerInfo.phone || '',
          country: customerInfo.country || t.address_selector.defaultCountry,
          city: customerInfo.city || '',
        }));
      }
    }
  }, [isDialogOpen, editingAddress, customerInfo]);

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await fetch('/api/customers/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(t.address_selector.addressCreateError);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers/addresses'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: t.address_selector.addressCreated });
    },
    onError: () => {
      toast({ title: t.address_selector.addressCreateError, variant: 'destructive' });
    }
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AddressFormData> }) => {
      const response = await fetch(`/api/customers/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(t.address_selector.addressUpdateError);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers/addresses'] });
      setIsDialogOpen(false);
      setEditingAddress(null);
      resetForm();
      toast({ title: t.address_selector.addressUpdated });
    },
    onError: () => {
      toast({ title: t.address_selector.addressUpdateError, variant: 'destructive' });
    }
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/customers/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error(t.address_selector.addressDeleteError);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers/addresses'] });
      toast({ title: t.address_selector.addressDeleted });
    },
    onError: () => {
      toast({ title: t.address_selector.addressDeleteError, variant: 'destructive' });
    }
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/customers/addresses/${id}/set-default`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error(t.address_selector.defaultAddressError);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers/addresses'] });
      toast({ title: t.address_selector.defaultAddressSet });
    },
    onError: () => {
      toast({ title: t.address_selector.defaultAddressError, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      recipientName: '',
      company: '',
      phone: '',
      country: t.address_selector.defaultCountry,
      state: '',
      city: '',
      address: '',
      postalCode: ''
    });
  };

  const handleEdit = (address: CustomerAddress) => {
    setEditingAddress(address);
    setFormData({
      title: address.title,
      recipientName: address.recipientName,
      company: address.company || '',
      phone: address.phone,
      country: address.country,
      state: address.state || '',
      city: address.city,
      address: address.address,
      postalCode: address.postalCode || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: formData });
    } else {
      createAddressMutation.mutate(formData);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    const address = addresses.find((addr: CustomerAddress) => addr.id.toString() === addressId);
    if (address) {
      onAddressSelect(address);
    }
  };

  // Auto-select default address on load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr: CustomerAddress) => addr.isDefault) || addresses[0];
      onAddressSelect(defaultAddress);
    }
  }, [addresses, selectedAddressId, onAddressSelect]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.address_selector.deliveryAddressTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">{t.address_selector.loadingAddresses}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t.address_selector.deliveryAddressTitle}</CardTitle>
          <CardDescription>{t.address_selector.selectAddressDescription}</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => { setEditingAddress(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t.address_selector.addNewAddress}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddress ? t.address_selector.editAddressTitle : t.address_selector.addAddressTitle}</DialogTitle>
              <DialogDescription>
                {t.address_selector.enterAddressInfo}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">{t.address_selector.addressTitle}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t.address_selector.addressTitlePlaceholder}
                  required
                />
              </div>

              <div>
                <Label htmlFor="recipientName">{t.address_selector.recipientNameLabel}</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder={t.address_selector.recipientNamePlaceholder}
                  required
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">{t.address_selector.recipientNameNote}</p>
              </div>

              <div>
                <Label htmlFor="address">{t.address_selector.fullAddressLabel}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t.address_selector.fullAddressPlaceholder}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">{t.address_selector.cityLabel}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">{t.address_selector.postalCodeLabel}</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder={t.address_selector.postalCodePlaceholder}
                  />
                </div>
              </div>

              {/* GPS Location Button */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>{t.address_selector.gpsLocationLabel}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <>{t.address_selector.gettingLocation}</>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        {t.address_selector.getLocationButton}
                      </>
                    )}
                  </Button>
                </div>
                {formData.latitude && formData.longitude && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <div>{t.address_selector.latitudeLabel} {formData.latitude.toFixed(6)}</div>
                    <div>{t.address_selector.longitudeLabel} {formData.longitude.toFixed(6)}</div>
                    {formData.locationAccuracy && (
                      <div>{t.address_selector.accuracyLabel} {Math.round(formData.locationAccuracy)} {t.address_selector.metersUnit}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                >
                  {editingAddress ? t.address_selector.updateButton : t.address_selector.addNewAddress}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.address_selector.cancelButton}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{t.address_selector.noAddressFound}</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.address_selector.addFirstAddress}
            </Button>
          </div>
        ) : (
          <RadioGroup 
            value={selectedAddressId?.toString() || ''} 
            onValueChange={handleAddressSelect}
            className="space-y-4"
          >
            {addresses.map((address: CustomerAddress) => (
              <div key={address.id} className="flex items-start space-x-3 space-x-reverse">
                <RadioGroupItem value={address.id.toString()} id={`address-${address.id}`} />
                <div className="flex-1">
                  <label htmlFor={`address-${address.id}`} className="cursor-pointer">
                    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{address.title}</span>
                          {address.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              {t.address_selector.defaultBadge}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleEdit(address);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              deleteAddressMutation.mutate(address.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {!address.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setDefaultMutation.mutate(address.id);
                              }}
                            >
                              {t.address_selector.setAsDefault}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="font-medium text-foreground">{t.address_selector.recipientLabel} {address.recipientName}</div>
                        <div>{address.firstName} {address.lastName}</div>
                        {address.company && <div>{address.company}</div>}
                        <div>{address.city}، {address.country}</div>
                        <div>{address.address}</div>
                        <div>{address.phone}</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}