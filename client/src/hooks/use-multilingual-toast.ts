import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export interface MultilingualToastOptions {
  title?: keyof typeof import("@/lib/i18n").translations.en;
  description?: keyof typeof import("@/lib/i18n").translations.en | string;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
}

export function useMultilingualToast() {
  const { toast } = useToast();
  const { t } = useLanguage();

  const showToast = ({ title, description, variant = "default", duration }: MultilingualToastOptions) => {
    const translatedTitle = title ? t[title] : undefined;
    const translatedDescription = typeof description === 'string' && description.length > 0 
      ? (t[description as keyof typeof t] || description)
      : description 
        ? t[description as keyof typeof t] 
        : undefined;

    return toast({
      title: translatedTitle,
      description: translatedDescription,
      variant,
      duration,
    });
  };

  return {
    toast: showToast,
    success: (description: keyof typeof import("@/lib/i18n").translations.en | string) => 
      showToast({ title: "success", description, variant: "default" }),
    error: (description: keyof typeof import("@/lib/i18n").translations.en | string) => 
      showToast({ title: "errorOccurred", description, variant: "destructive" }),
    warning: (description: keyof typeof import("@/lib/i18n").translations.en | string) => 
      showToast({ title: "warning", description, variant: "warning" }),
    info: (description: keyof typeof import("@/lib/i18n").translations.en | string) => 
      showToast({ title: "info", description, variant: "default" }),
  };
}