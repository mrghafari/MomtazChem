import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Specialist {
  id: string;
  name: string;
  email: string;
  department: string;
  phone?: string;
  status?: string;
  expertise?: string[];
  isActive?: boolean;
}

export default function SpecialistsAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    phone: "",
    expertise: ""
  });

  const { data: specialists, refetch } = useQuery({
    queryKey: ['/api/admin/specialists'],
  });

  const specialistsList = Array.isArray(specialists) ? specialists : [];

  const createSpecialistMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/specialists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed: ${response.status} ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetch();
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "موفق",
        description: "کارشناس با موفقیت اضافه شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: `خطا در اضافه کردن کارشناس: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateSpecialistMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/specialists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed: ${response.status} ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetch();
      resetForm();
      setIsDialogOpen(false);
      setEditingSpecialist(null);
      toast({
        title: "موفق",
        description: "کارشناس با موفقیت به‌روزرسانی شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: `خطا در به‌روزرسانی کارشناس: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteSpecialistMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/specialists/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed: ${response.status} ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "موفق",
        description: "کارشناس با موفقیت حذف شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: `خطا در حذف کارشناس: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      department: "",
      phone: "",
      expertise: ""
    });
  };

  const openEditDialog = (specialist: Specialist) => {
    setEditingSpecialist(specialist);
    setFormData({
      name: specialist.name,
      email: specialist.email,
      department: specialist.department,
      phone: specialist.phone || "",
      expertise: Array.isArray(specialist.expertise) ? specialist.expertise.join(", ") : ""
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSpecialist(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      expertise: formData.expertise.split(",").map(s => s.trim()).filter(s => s)
    };

    if (editingSpecialist) {
      await updateSpecialistMutation.mutateAsync({ id: editingSpecialist.id, data: submitData });
    } else {
      await createSpecialistMutation.mutateAsync(submitData);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("آیا مطمئن هستید که می‌خواهید این کارشناس را حذف کنید؟")) {
      await deleteSpecialistMutation.mutateAsync(id);
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت کارشناسان</h1>
          <p className="text-gray-600 mt-2">
            مدیریت کارشناسان پشتیبانی آنلاین
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                افزودن کارشناس
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSpecialist ? "ویرایش کارشناس" : "افزودن کارشناس جدید"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">نام</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="نام کارشناس"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="ایمیل کارشناس"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">بخش</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="بخش کاری"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">تلفن</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="شماره تلفن"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expertise">تخصص‌ها (با کاما جدا کنید)</Label>
                  <Input
                    id="expertise"
                    value={formData.expertise}
                    onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                    placeholder="مثال: مشاوره فنی, فروش, پشتیبانی"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    انصراف
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSpecialistMutation.isPending || updateSpecialistMutation.isPending}
                  >
                    {editingSpecialist ? "به‌روزرسانی" : "افزودن"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {specialistsList && specialistsList.length > 0 ? specialistsList.map((specialist: Specialist) => (
          <Card key={specialist.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold">{specialist.name}</h3>
                    <span className="text-sm text-gray-600">{specialist.department}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      specialist.status === 'online' ? 'bg-green-100 text-green-700' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {specialist.status === 'online' ? 'آنلاین' : 'آفلاین'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>ایمیل: {specialist.email}</div>
                    {specialist.phone && <div>تلفن: {specialist.phone}</div>}
                    {specialist.expertise && specialist.expertise.length > 0 && (
                      <div>تخصص‌ها: {Array.isArray(specialist.expertise) ? specialist.expertise.join(", ") : specialist.expertise}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(specialist)}
                    disabled={updateSpecialistMutation.isPending}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(specialist.id)}
                    disabled={deleteSpecialistMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">هیچ کارشناسی یافت نشد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}