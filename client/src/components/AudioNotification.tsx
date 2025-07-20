import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface AudioNotificationProps {
  department: 'financial' | 'warehouse' | 'logistics';
  enabled?: boolean;
  interval?: number; // Refresh interval in milliseconds
}

interface Order {
  id: number;
  customerOrderId: number;
  createdAt: string;
  currentStatus: string;
}

const AudioNotification = ({ 
  department, 
  enabled = true, 
  interval = 30000 // 30 seconds default
}: AudioNotificationProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [lastOrderCount, setLastOrderCount] = useState<number | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Query for orders in the specified department
  const { data: ordersData, isError } = useQuery({
    queryKey: [`/api/${department}/orders`],
    refetchInterval: enabled ? interval : false,
    refetchIntervalInBackground: true,
    enabled: enabled,
  });

  // Create beep sound programmatically
  const playBeep = () => {
    if (!enabled) return;

    try {
      // Create audio context for beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure beep sound
      oscillator.frequency.value = 800; // 800 Hz frequency
      oscillator.type = 'sine';
      
      // Beep duration and volume
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      console.log(`🔔 [${department.toUpperCase()}] Playing audio notification - new order detected`);
    } catch (error) {
      console.error('Error playing beep:', error);
      
      // Fallback: Try to play HTML audio element if available
      if (audioRef.current) {
        audioRef.current.play().catch(e => 
          console.warn('Failed to play audio notification:', e)
        );
      }
    }
  };

  useEffect(() => {
    if (!ordersData || isError || !enabled) return;

    // Handle different response structures
    const orders = (ordersData as any)?.orders || (ordersData as any)?.data || [];
    const currentOrderCount = Array.isArray(orders) ? orders.length : 0;

    // Skip notification on first load
    if (isFirstLoad) {
      setLastOrderCount(currentOrderCount);
      setIsFirstLoad(false);
      console.log(`🔔 [${department.toUpperCase()}] Initial order count: ${currentOrderCount}`);
      return;
    }

    // Check if new orders have arrived
    if (lastOrderCount !== null && currentOrderCount > lastOrderCount) {
      const newOrdersCount = currentOrderCount - lastOrderCount;
      console.log(`🔔 [${department.toUpperCase()}] New orders detected: ${newOrdersCount} (${lastOrderCount} → ${currentOrderCount})`);
      
      // Play beep notification
      playBeep();
      
      // Show console notification in Persian
      const departmentNames = {
        financial: 'مالی',
        warehouse: 'انبار', 
        logistics: 'لجستیک'
      };
      
      console.log(`🔔 [هشدار صوتی] سفارش جدید در بخش ${departmentNames[department]} - تعداد: ${newOrdersCount}`);
    }

    setLastOrderCount(currentOrderCount);
  }, [ordersData, lastOrderCount, isFirstLoad, department, enabled]);

  // Render hidden audio element as fallback
  return enabled ? (
    <audio
      ref={audioRef}
      preload="auto"
      style={{ display: 'none' }}
    >
      {/* Fallback audio source - you can add an actual audio file here if needed */}
      <source src="data:audio/wav;base64,UklGRvIGAABXQVZFZm10IBAAAAABA..." type="audio/wav" />
    </audio>
  ) : null;
};

export default AudioNotification;