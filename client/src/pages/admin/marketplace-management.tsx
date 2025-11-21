import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Store, Check, X, Eye, Package, Mail, Phone, MapPin, Calendar, TrendingUp, Star } from "lucide-react";

type Vendor = {
  id: number;
  vendorName: string;
  vendorNameAr: string;
  vendorNameKu: string;
  vendorNameTr: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: string;
  businessLicense: string;
  taxId: string;
  description: string;
  logo: string | null;
  isApproved: boolean;
  isActive: boolean;
  approvedBy: number | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  totalSales: string;
  rating: string;
  totalReviews: number;
  createdAt: string;
};

export default function MarketplaceManagement() {
  const { toast } = useToast();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [toggleAction, setToggleAction] = useState<{ vendorId: number; currentStatus: boolean } | null>(null);

  // Fetch all vendors
  const { data: allVendors, isLoading: loadingAll } = useQuery<{ vendors: Vendor[] }>({
    queryKey: ["/api/admin/vendors"],
  });

  // Fetch pending vendors
  const { data: pendingVendors, isLoading: loadingPending } = useQuery<{ vendors: Vendor[] }>({
    queryKey: ["/api/admin/vendors/pending"],
  });

  // Fetch approved vendors
  const { data: approvedVendors, isLoading: loadingApproved } = useQuery<{ vendors: Vendor[] }>({
    queryKey: ["/api/admin/vendors/approved"],
  });

  // Approve vendor mutation
  const approveMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      return await apiRequest(`/api/admin/vendors/${vendorId}/approve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/approved"] });
      toast({
        title: "موفق!",
        description: "فروشنده با موفقیت تایید شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا!",
        description: "خطا در تایید فروشنده",
        variant: "destructive",
      });
    },
  });

  // Reject vendor mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ vendorId, reason }: { vendorId: number; reason: string }) => {
      return await apiRequest(`/api/admin/vendors/${vendorId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/approved"] });
      setShowRejectDialog(false);
      setRejectionReason("");
      toast({
        title: "موفق!",
        description: "فروشنده رد شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا!",
        description: "خطا در رد کردن فروشنده",
        variant: "destructive",
      });
    },
  });

  // Update vendor status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ vendorId, isActive }: { vendorId: number; isActive: boolean }) => {
      return await apiRequest(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/approved"] });
      toast({
        title: "موفق!",
        description: "وضعیت فروشنده بروزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا!",
        description: "خطا در بروزرسانی وضعیت",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowApproveDialog(true);
  };

  const handleApproveConfirm = () => {
    if (selectedVendor) {
      approveMutation.mutate(selectedVendor.id);
      setShowApproveDialog(false);
    }
  };

  const handleReject = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowRejectDialog(true);
  };

  const handleRejectSubmit = () => {
    if (!selectedVendor) return;
    if (!rejectionReason.trim()) {
      toast({
        title: "خطا!",
        description: "لطفاً دلیل رد کردن را وارد کنید",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({
      vendorId: selectedVendor.id,
      reason: rejectionReason,
    });
  };

  const handleToggleStatus = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setToggleAction({ vendorId: vendor.id, currentStatus: vendor.isActive });
    setShowToggleDialog(true);
  };

  const handleToggleConfirm = () => {
    if (toggleAction) {
      updateStatusMutation.mutate({
        vendorId: toggleAction.vendorId,
        isActive: !toggleAction.currentStatus,
      });
      setShowToggleDialog(false);
    }
  };

  const handleViewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowDetailsDialog(true);
  };

  const VendorCard = ({ vendor }: { vendor: Vendor }) => (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`vendor-card-${vendor.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {vendor.logo ? (
              <img src={vendor.logo} alt={vendor.vendorName} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg" data-testid={`vendor-name-${vendor.id}`}>{vendor.vendorName}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {vendor.vendorNameAr && <span className="block text-right">{vendor.vendorNameAr}</span>}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {vendor.isApproved ? (
              <Badge variant="default" className="bg-green-500" data-testid={`status-approved-${vendor.id}`}>
                <Check className="w-3 h-3 mr-1" />
                تایید شده
              </Badge>
            ) : (
              <Badge variant="secondary" data-testid={`status-pending-${vendor.id}`}>
                در انتظار تایید
              </Badge>
            )}
            {vendor.isActive ? (
              <Badge variant="outline" className="text-green-600 border-green-600" data-testid={`status-active-${vendor.id}`}>
                فعال
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500 border-gray-400" data-testid={`status-inactive-${vendor.id}`}>
                غیرفعال
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span data-testid={`vendor-email-${vendor.id}`}>{vendor.contactEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span data-testid={`vendor-phone-${vendor.id}`}>{vendor.contactPhone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1" data-testid={`vendor-address-${vendor.id}`}>{vendor.businessAddress}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-3 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                <TrendingUp className="w-4 h-4 text-green-600" />
                {parseFloat(vendor.totalSales).toLocaleString("en-US")} IQD
              </div>
              <div className="text-xs text-muted-foreground mt-1">کل فروش</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                <Star className="w-4 h-4 text-yellow-500" />
                {parseFloat(vendor.rating).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">امتیاز</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                <Package className="w-4 h-4 text-blue-600" />
                {vendor.totalReviews}
              </div>
              <div className="text-xs text-muted-foreground mt-1">نظرات</div>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleViewDetails(vendor)}
              data-testid={`button-view-details-${vendor.id}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              جزئیات
            </Button>
            
            {!vendor.isApproved && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(vendor)}
                  disabled={approveMutation.isPending}
                  data-testid={`button-approve-${vendor.id}`}
                >
                  <Check className="w-4 h-4 mr-2" />
                  تایید
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleReject(vendor)}
                  disabled={rejectMutation.isPending}
                  data-testid={`button-reject-${vendor.id}`}
                >
                  <X className="w-4 h-4 mr-2" />
                  رد
                </Button>
              </>
            )}
            
            {vendor.isApproved && (
              <Button
                variant={vendor.isActive ? "outline" : "default"}
                size="sm"
                className="flex-1"
                onClick={() => handleToggleStatus(vendor)}
                disabled={updateStatusMutation.isPending}
                data-testid={`button-toggle-status-${vendor.id}`}
              >
                {vendor.isActive ? "غیرفعال کردن" : "فعال کردن"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-testid="page-title">
            مدیریت بازارگاه چند فروشنده‌ای
          </h1>
          <p className="text-muted-foreground" data-testid="page-description">
            مدیریت فروشندگان، تایید و کنترل محصولات آنها
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md" data-testid="vendor-tabs">
            <TabsTrigger value="pending" data-testid="tab-pending">
              در انتظار ({pendingVendors?.vendors?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              تایید شده ({approvedVendors?.vendors?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              همه ({allVendors?.vendors?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4" data-testid="content-pending">
            {loadingPending ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
              </div>
            ) : pendingVendors?.vendors?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">هیچ فروشنده‌ای در انتظار تایید نیست</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    فروشندگان جدید پس از ثبت‌نام در اینجا نمایش داده می‌شوند
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingVendors?.vendors?.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4" data-testid="content-approved">
            {loadingApproved ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
              </div>
            ) : approvedVendors?.vendors?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">هیچ فروشنده تایید شده‌ای وجود ندارد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedVendors?.vendors?.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4" data-testid="content-all">
            {loadingAll ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
              </div>
            ) : allVendors?.vendors?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">هیچ فروشنده‌ای ثبت نشده است</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allVendors?.vendors?.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent data-testid="dialog-reject">
            <DialogHeader>
              <DialogTitle>رد کردن فروشنده</DialogTitle>
              <DialogDescription>
                لطفاً دلیل رد کردن {selectedVendor?.vendorName} را مشخص کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">دلیل رد کردن</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="مثال: مدارک ارسال شده ناقص است..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  data-testid="input-rejection-reason"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(false)}
                  data-testid="button-cancel-reject"
                >
                  لغو
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRejectSubmit}
                  disabled={rejectMutation.isPending}
                  data-testid="button-confirm-reject"
                >
                  {rejectMutation.isPending ? "در حال پردازش..." : "تایید رد کردن"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl" data-testid="dialog-details">
            <DialogHeader>
              <DialogTitle>جزئیات فروشنده</DialogTitle>
            </DialogHeader>
            {selectedVendor && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4">
                  {selectedVendor.logo ? (
                    <img src={selectedVendor.logo} alt={selectedVendor.vendorName} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Store className="w-10 h-10 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold" data-testid="details-vendor-name">{selectedVendor.vendorName}</h3>
                    <p className="text-muted-foreground">{selectedVendor.vendorNameAr}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">ایمیل</Label>
                    <p className="font-medium" data-testid="details-email">{selectedVendor.contactEmail}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">تلفن</Label>
                    <p className="font-medium" data-testid="details-phone">{selectedVendor.contactPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">آدرس</Label>
                    <p className="font-medium" data-testid="details-address">{selectedVendor.businessAddress}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">مجوز کسب‌وکار</Label>
                    <p className="font-medium" data-testid="details-license">{selectedVendor.businessLicense}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">شناسه مالیاتی</Label>
                    <p className="font-medium" data-testid="details-tax-id">{selectedVendor.taxId}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">توضیحات</Label>
                    <p className="font-medium" data-testid="details-description">{selectedVendor.description || "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-muted-foreground">کل فروش</Label>
                    <p className="text-lg font-bold text-green-600" data-testid="details-total-sales">
                      {parseFloat(selectedVendor.totalSales).toLocaleString("en-US")} IQD
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">امتیاز</Label>
                    <p className="text-lg font-bold text-yellow-600" data-testid="details-rating">
                      {parseFloat(selectedVendor.rating).toFixed(1)} ⭐
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">تعداد نظرات</Label>
                    <p className="text-lg font-bold" data-testid="details-reviews">{selectedVendor.totalReviews}</p>
                  </div>
                </div>

                {selectedVendor.approvedAt && (
                  <div className="pt-4 border-t">
                    <Label className="text-muted-foreground">تاریخ تایید</Label>
                    <p className="font-medium" data-testid="details-approved-at">
                      {new Date(selectedVendor.approvedAt).toLocaleDateString("fa-IR")}
                    </p>
                  </div>
                )}

                {selectedVendor.rejectionReason && (
                  <div className="pt-4 border-t">
                    <Label className="text-muted-foreground text-red-600">دلیل رد شدن</Label>
                    <p className="font-medium text-red-600" data-testid="details-rejection-reason">
                      {selectedVendor.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approve Confirmation Dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent data-testid="dialog-approve-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>تایید فروشنده</AlertDialogTitle>
              <AlertDialogDescription>
                آیا از تایید فروشنده <strong>{selectedVendor?.vendorName}</strong> اطمینان دارید؟
                پس از تایید، فروشنده می‌تواند محصولات خود را در بازارگاه اضافه کند.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-approve">لغو</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleApproveConfirm}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-confirm-approve"
              >
                تایید نهایی
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toggle Status Confirmation Dialog */}
        <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
          <AlertDialogContent data-testid="dialog-toggle-status-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>تغییر وضعیت فروشنده</AlertDialogTitle>
              <AlertDialogDescription>
                آیا می‌خواهید فروشنده <strong>{selectedVendor?.vendorName}</strong> را{" "}
                <strong>{toggleAction?.currentStatus ? "غیرفعال" : "فعال"}</strong> کنید؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-toggle">لغو</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleConfirm}
                data-testid="button-confirm-toggle"
              >
                تایید
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
