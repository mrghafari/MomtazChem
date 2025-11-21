import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const productSchema = z.object({
  name: z.string().min(3, "نام محصول باید حداقل 3 کاراکتر باشد"),
  technicalName: z.string().optional(),
  sku: z.string().min(3, "SKU الزامی است"),
  barcode: z.string().min(8, "بارکد باید حداقل 8 رقم باشد"),
  stockQuantity: z.number().min(0, "موجودی نمی‌تواند منفی باشد"),
  unitPrice: z.number().min(0, "قیمت نمی‌تواند منفی باشد"),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function VendorAddProduct() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      technicalName: "",
      sku: "",
      barcode: "",
      stockQuantity: 0,
      unitPrice: 0,
      description: "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      return apiRequest("/api/vendors/products", {
        method: "POST",
        body: {
          ...data,
          status: "active",
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ موفق",
        description: "محصول با موفقیت اضافه شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/products"] });
      setLocation("/vendor/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا",
        description: error.message || "خطا در افزودن محصول",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductForm) => {
    createProductMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Link href="/vendor/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت به داشبورد
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">افزودن محصول جدید</CardTitle>
                <CardDescription>اطلاعات محصول خود را وارد کنید</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام محصول *</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: محلول شیمیایی A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="technicalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام فنی</FormLabel>
                        <FormControl>
                          <Input placeholder="نام فنی محصول" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU *</FormLabel>
                        <FormControl>
                          <Input placeholder="VND-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>بارکد *</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>موجودی *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قیمت واحد (IQD) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="توضیحات کامل محصول..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createProductMutation.isPending}
                    className="flex-1"
                    data-testid="button-submit-product"
                  >
                    {createProductMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        در حال ذخیره...
                      </>
                    ) : (
                      "افزودن محصول"
                    )}
                  </Button>
                  <Link href="/vendor/dashboard">
                    <Button type="button" variant="outline">
                      انصراف
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
