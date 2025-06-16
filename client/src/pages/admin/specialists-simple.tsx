import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

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

  const { data: specialists, refetch } = useQuery({
    queryKey: ['/api/admin/specialists'],
  });

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

  const testCreateSpecialist = async () => {
    try {
      await createSpecialistMutation.mutateAsync({
        name: "تست کارشناس",
        email: `test${Date.now()}@example.com`,
        department: "فنی",
        phone: "09123456789",
        expertise: ["تست"]
      });
    } catch (error) {
      console.error('Test creation failed:', error);
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
          <Button 
            onClick={testCreateSpecialist}
            variant="outline"
            size="sm"
          >
            تست ایجاد کارشناس
          </Button>
          
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            افزودن کارشناس
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {specialists && specialists.length > 0 ? specialists.map((specialist: Specialist) => (
          <Card key={specialist.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold">{specialist.name}</h3>
                    <span className="text-sm text-gray-600">{specialist.department}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>ایمیل: {specialist.email}</div>
                    {specialist.phone && <div>تلفن: {specialist.phone}</div>}
                  </div>
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