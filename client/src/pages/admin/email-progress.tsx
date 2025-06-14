import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import EmailSetupProgress from "@/components/ui/email-setup-progress";

interface EmailCategory {
  id: number;
  categoryKey: string;
  categoryName: string;
  description: string;
  isActive: boolean;
  smtp?: any;
  recipients: any[];
}

export default function EmailProgressPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<EmailCategory | null>(null);

  // Load categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["/api/admin/email/categories"],
    queryFn: () => fetch("/api/admin/email/categories").then(res => res.json())
  });

  const categories: EmailCategory[] = categoriesData?.categories || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading email progress...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => setLocation("/admin/email-settings")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Email Settings
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Email Setup Progress Tracker</h1>
          <p className="text-gray-600 mt-1">Track your progress through the email configuration process</p>
        </div>
      </div>

      <EmailSetupProgress 
        categories={categories}
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          setLocation("/admin/email-settings");
        }}
        selectedCategory={selectedCategory || undefined}
      />
    </div>
  );
}