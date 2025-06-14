/**
 * Utility functions for generating personalized greetings based on time of day
 */

export const getTimeBasedGreeting = (language: 'en' | 'fa' = 'en'): string => {
  const hour = new Date().getHours();
  
  if (language === 'fa') {
    if (hour >= 5 && hour < 12) {
      return 'صبح بخیر';
    } else if (hour >= 12 && hour < 17) {
      return 'ظهر بخیر';
    } else if (hour >= 17 && hour < 20) {
      return 'عصر بخیر';
    } else {
      return 'شب بخیر';
    }
  } else {
    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  }
};

export const getPersonalizedWelcome = (
  userName: string, 
  role: 'admin' | 'customer' | 'manager' = 'admin',
  language: 'en' | 'fa' = 'en'
): string => {
  const greeting = getTimeBasedGreeting(language);
  
  if (language === 'fa') {
    switch (role) {
      case 'admin':
        return `${greeting}، مدیر عزیز!`;
      case 'customer':
        return `${greeting}، ${userName} عزیز!`;
      case 'manager':
        return `${greeting}، ${userName}!`;
      default:
        return `${greeting}، ${userName}!`;
    }
  } else {
    switch (role) {
      case 'admin':
        return `${greeting}, Administrator!`;
      case 'customer':
        return `${greeting}, ${userName}!`;
      case 'manager':
        return `${greeting}, ${userName}!`;
      default:
        return `${greeting}, ${userName}!`;
    }
  }
};

export const getDashboardMotivation = (
  role: 'admin' | 'customer' | 'manager' = 'admin',
  language: 'en' | 'fa' = 'en'
): string => {
  const hour = new Date().getHours();
  
  if (language === 'fa') {
    if (hour >= 5 && hour < 12) {
      switch (role) {
        case 'admin':
          return 'آماده برای شروع روز جدیدی از مدیریت هستید؟';
        case 'customer':
          return 'داشبورد شخصی شما آماده است';
        case 'manager':
          return 'مرکز کنترل شما فعال است';
        default:
          return 'سیستم آماده است';
      }
    } else if (hour >= 12 && hour < 17) {
      switch (role) {
        case 'admin':
          return 'ادامه‌ی موفق کار امروز!';
        case 'customer':
          return 'امیدواریم روز خوبی داشته باشید';
        case 'manager':
          return 'کارتان عالی پیش می‌رود';
        default:
          return 'روز پربرکتی داشته باشید';
      }
    } else {
      switch (role) {
        case 'admin':
          return 'مرکز مدیریت شما آماده است';
        case 'customer':
          return 'داشبورد شما در دسترس است';
        case 'manager':
          return 'سیستم‌های شما فعال هستند';
        default:
          return 'همه چیز آماده است';
      }
    }
  } else {
    if (hour >= 5 && hour < 12) {
      switch (role) {
        case 'admin':
          return 'Ready to tackle a new day of management?';
        case 'customer':
          return 'Your personal dashboard is ready for you';
        case 'manager':
          return 'Your control center is active and ready';
        default:
          return 'Everything is ready for you';
      }
    } else if (hour >= 12 && hour < 17) {
      switch (role) {
        case 'admin':
          return 'Keep up the excellent work today!';
        case 'customer':
          return 'Hope you\'re having a productive day';
        case 'manager':
          return 'Your operations are running smoothly';
        default:
          return 'Having a great day so far!';
      }
    } else {
      switch (role) {
        case 'admin':
          return 'Your management center awaits';
        case 'customer':
          return 'Your dashboard is available anytime';
        case 'manager':
          return 'All systems are active and ready';
        default:
          return 'Everything is ready when you are';
      }
    }
  }
};