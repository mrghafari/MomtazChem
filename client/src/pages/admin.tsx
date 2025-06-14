import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShowcaseProductSchema, type ShowcaseProduct, type InsertShowcaseProduct } from "@shared/showcase-schema";
import { Plus, Edit, Trash2, Package, DollarSign, Beaker, Droplet, LogOut, User, Upload, Image, FileText, X, AlertTriangle, CheckCircle, AlertCircle, XCircle, TrendingUp, TrendingDown, BarChart3, QrCode, Mail, Search, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { value: "fuel-additives", label: "Fuel Additives", icon: <Beaker className="w-4 h-4" /> },
  { value: "water-treatment", label: "Water Treatment", icon: <Droplet className="w-4 h-4" /> },
  { value: "paint-thinner", label: "Paint & Thinner", icon: <Package className="w-4 h-4" /> },
  { value: "agricultural-fertilizers", label: "Agricultural Fertilizers", icon: <Package className="w-4 h-4" /> },
];

export default function Admin() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Product sync mutation
  const syncProductsMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/sync-products", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Products synced successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync products",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Site Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage system administration and operations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">{user?.username}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                logout();
                setLocation("/admin/login");
              }}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Management Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <Button 
            onClick={() => syncProductsMutation.mutate()}
            disabled={syncProductsMutation.isPending}
            variant="outline"
            className="border-green-300 text-green-600 hover:bg-green-50 h-12 text-sm"
          >
            <Package className="w-4 h-4 mr-2" />
            {syncProductsMutation.isPending ? 'Syncing...' : 'Sync Shop'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/specialists")}
            className="border-blue-300 text-blue-600 hover:bg-blue-50 h-12 text-sm"
          >
            <User className="w-4 h-4 mr-2" />
            Specialists
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/inquiries")}
            className="border-orange-300 text-orange-600 hover:bg-orange-50 h-12 text-sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Inquiries
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/barcode-inventory")}
            className="border-purple-300 text-purple-600 hover:bg-purple-50 h-12 text-sm"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Barcode
          </Button>

          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/database-management")}
            className="border-gray-300 text-gray-600 hover:bg-gray-50 h-12 text-sm"
          >
            <Database className="w-4 h-4 mr-2" />
            Database Backup
          </Button>

          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/user-management")}
            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 h-12 text-sm"
          >
            <User className="w-4 h-4 mr-2" />
            User Management
          </Button>

          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/factory-management")}
            className="border-amber-300 text-amber-600 hover:bg-amber-50 h-12 text-sm"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Factory Management
          </Button>

          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/smtp-test")}
            className="border-teal-300 text-teal-600 hover:bg-teal-50 h-12 text-sm"
          >
            <Mail className="w-4 h-4 mr-2" />
            SMTP Test
          </Button>

          <Button 
            variant="outline"
            onClick={() => setLocation("/shop")}
            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 h-12 text-sm"
          >
            <Package className="w-4 h-4 mr-2" />
            Shop
          </Button>

          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/crm")}
            className="border-pink-300 text-pink-600 hover:bg-pink-50 h-12 text-sm"
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            CRM
          </Button>
        </div>
      </div>
    </div>
  );
}