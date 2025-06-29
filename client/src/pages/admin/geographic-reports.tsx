import { useState } from "react";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import GeographicDistribution from "@/components/reports/geographic-distribution";

export default function GeographicReportsPage() {
  const [, navigate] = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به داشبورد
          </Button>
        </div>

        {/* Geographic Distribution Component */}
        <GeographicDistribution />
      </div>
    </div>
  );
}