import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GlobalRefreshSettings {
  syncEnabled: boolean;
  globalInterval: number;
  financialInterval: number;
  warehouseInterval: number;
  logisticsInterval: number;
  walletInterval: number;
  shopInterval: number;
  inventoryInterval: number;
  crmInterval: number;
  inquiriesInterval: number;
  securityInterval: number;
}

const DEFAULT_SETTINGS: GlobalRefreshSettings = {
  syncEnabled: true,
  globalInterval: 300, // 5 minutes
  financialInterval: 300,
  warehouseInterval: 300,
  logisticsInterval: 300,
  walletInterval: 60,
  shopInterval: 120,
  inventoryInterval: 180,
  crmInterval: 300,
  inquiriesInterval: 240,
  securityInterval: 120
};

export function useGlobalRefresh(pageName: string, onRefresh: () => void) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GlobalRefreshSettings>(DEFAULT_SETTINGS);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('global-refresh-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
    }
  }, []);

  // Get the appropriate interval for this page
  const getPageInterval = (): number => {
    if (settings.syncEnabled) {
      return settings.globalInterval;
    }
    
    const intervalMap: Record<string, keyof GlobalRefreshSettings> = {
      'financial': 'financialInterval',
      'warehouse': 'warehouseInterval',
      'logistics': 'logisticsInterval',
      'wallet': 'walletInterval',
      'shop': 'shopInterval',
      'inventory': 'inventoryInterval',
      'crm': 'crmInterval',
      'inquiries': 'inquiriesInterval',
      'security': 'securityInterval'
    };

    const intervalKey = intervalMap[pageName.toLowerCase()];
    return intervalKey ? settings[intervalKey] : settings.globalInterval;
  };

  // Auto refresh logic
  useEffect(() => {
    const interval = getPageInterval();
    setTimeLeft(interval);

    if (isActive && interval > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onRefresh();
            toast({
              title: "صفحه به‌روزرسانی شد",
              description: `${pageName} به‌طور خودکار به‌روزرسانی شد`,
            });
            return interval;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setTimeLeft(interval);
    }
  }, [isActive, settings, pageName, onRefresh, toast]);

  const toggleAutoRefresh = () => {
    setIsActive(!isActive);
  };

  const manualRefresh = () => {
    onRefresh();
    setTimeLeft(getPageInterval());
    toast({
      title: "صفحه به‌روزرسانی شد",
      description: `${pageName} دستی به‌روزرسانی شد`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return {
    isActive,
    timeLeft,
    interval: getPageInterval(),
    settings,
    toggleAutoRefresh,
    manualRefresh,
    formatTime,
    syncEnabled: settings.syncEnabled
  };
}