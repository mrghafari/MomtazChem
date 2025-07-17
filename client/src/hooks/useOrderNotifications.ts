import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

interface NotificationHook {
  department: 'financial' | 'warehouse' | 'logistics';
  enabled: boolean;
}

export function useOrderNotifications({ department, enabled }: NotificationHook) {
  const previousCountRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    if (enabled) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
      
      // Create a simple notification beep sound programmatically
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Create a short beep sound (800Hz for 200ms)
      const createBeep = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // 800Hz frequency
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      };

      audioRef.current.playBeep = createBeep;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [enabled]);

  // Query orders for the specific department
  const { data: ordersResponse } = useQuery({
    queryKey: department === 'financial' ? ['/api/financial/orders'] : 
              department === 'warehouse' ? ['/api/order-management/warehouse'] :
              ['/api/order-management/logistics'],
    enabled: enabled,
    refetchInterval: 5000, // Check every 5 seconds
    staleTime: 0,
  });

  // Extract orders array from response
  const orders = ordersResponse?.orders || ordersResponse?.data || [];

  // Check for new orders and play notification
  useEffect(() => {
    if (!enabled || !orders || !Array.isArray(orders)) {
      return;
    }

    const currentCount = orders.length;

    // If this is not the first load and count has increased
    if (previousCountRef.current !== null && currentCount > previousCountRef.current) {
      const newOrdersCount = currentCount - previousCountRef.current;
      
      // Play notification sound
      if (audioRef.current && audioRef.current.playBeep) {
        try {
          audioRef.current.playBeep();
          
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            const departmentNames = {
              financial: 'بخش مالی',
              warehouse: 'انبار',
              logistics: 'لجستیک'
            };
            
            new Notification(`سفارش جدید - ${departmentNames[department]}`, {
              body: `${newOrdersCount} سفارش جدید دریافت شد`,
              icon: '/favicon.ico',
              tag: `${department}-notification`
            });
          }
          
          console.log(`🔔 [${department.toUpperCase()}] نوتیفیکیشن: ${newOrdersCount} سفارش جدید دریافت شد`);
        } catch (error) {
          console.error('خطا در پخش صدای نوتیفیکیشن:', error);
        }
      }
    }

    previousCountRef.current = currentCount;
  }, [orders, enabled, department]);

  // Request notification permission on mount
  useEffect(() => {
    if (enabled && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enabled]);

  return {
    orderCount: orders?.length || 0,
    isNotificationEnabled: enabled
  };
}