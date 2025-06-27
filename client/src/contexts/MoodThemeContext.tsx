import React, { createContext, useContext, useState, useEffect } from 'react';

// Define mood types and their associated color schemes
export type MoodType = 'calm' | 'energetic' | 'focused' | 'creative' | 'confident' | 'peaceful';

interface MoodTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    card: string;
    popover: string;
    destructive: string;
    success: string;
    warning: string;
  };
  gradients: {
    main: string;
    subtle: string;
    card: string;
  };
  description: string;
  emoji: string;
}

const moodThemes: Record<MoodType, MoodTheme> = {
  calm: {
    name: 'Calm',
    emoji: '🧘',
    description: 'Soothing blues and soft greens for relaxation',
    colors: {
      primary: '197 76% 57%',    // Soft blue
      secondary: '197 20% 85%',  // Light blue-gray
      accent: '142 76% 73%',     // Soft green
      background: '210 40% 98%', // Very light blue-white
      foreground: '222 84% 5%',  // Dark blue-black
      muted: '210 40% 96%',      // Muted blue-white
      border: '214 32% 91%',     // Light blue border
      card: '210 40% 100%',      // Pure white with blue tint
      popover: '210 40% 100%',   // Pure white with blue tint
      destructive: '0 84% 60%',  // Soft red
      success: '142 76% 55%',    // Calming green
      warning: '43 96% 56%',     // Soft yellow
    },
    gradients: {
      main: 'linear-gradient(135deg, hsl(197, 76%, 57%), hsl(142, 76%, 73%))',
      subtle: 'linear-gradient(135deg, hsl(210, 40%, 98%), hsl(197, 20%, 95%))',
      card: 'linear-gradient(135deg, hsl(210, 40%, 100%), hsl(197, 10%, 98%))',
    }
  },
  energetic: {
    name: 'Energetic',
    emoji: '⚡',
    description: 'Vibrant oranges and reds for high energy',
    colors: {
      primary: '20 91% 48%',     // Vibrant orange
      secondary: '20 20% 85%',   // Light orange-gray
      accent: '346 77% 49%',     // Energetic red
      background: '25 40% 98%',  // Warm white
      foreground: '222 84% 5%',  // Dark
      muted: '25 40% 96%',       // Muted warm white
      border: '25 32% 91%',      // Light orange border
      card: '25 40% 100%',       // Pure white with warm tint
      popover: '25 40% 100%',    // Pure white with warm tint
      destructive: '0 84% 60%',  // Red
      success: '142 76% 55%',    // Green
      warning: '43 96% 56%',     // Yellow
    },
    gradients: {
      main: 'linear-gradient(135deg, hsl(20, 91%, 48%), hsl(346, 77%, 49%))',
      subtle: 'linear-gradient(135deg, hsl(25, 40%, 98%), hsl(20, 20%, 95%))',
      card: 'linear-gradient(135deg, hsl(25, 40%, 100%), hsl(20, 10%, 98%))',
    }
  },
  focused: {
    name: 'Focused',
    emoji: '🎯',
    description: 'Deep purples and grays for concentration',
    colors: {
      primary: '263 85% 60%',    // Deep purple
      secondary: '263 20% 85%',  // Light purple-gray
      accent: '221 83% 53%',     // Focused blue
      background: '270 20% 98%', // Cool white
      foreground: '222 84% 5%',  // Dark
      muted: '270 20% 96%',      // Muted cool white
      border: '270 32% 91%',     // Light purple border
      card: '270 20% 100%',      // Pure white with cool tint
      popover: '270 20% 100%',   // Pure white with cool tint
      destructive: '0 84% 60%',  // Red
      success: '142 76% 55%',    // Green
      warning: '43 96% 56%',     // Yellow
    },
    gradients: {
      main: 'linear-gradient(135deg, hsl(263, 85%, 60%), hsl(221, 83%, 53%))',
      subtle: 'linear-gradient(135deg, hsl(270, 20%, 98%), hsl(263, 20%, 95%))',
      card: 'linear-gradient(135deg, hsl(270, 20%, 100%), hsl(263, 10%, 98%))',
    }
  },
  creative: {
    name: 'Creative',
    emoji: '🎨',
    description: 'Vibrant pinks and purples for inspiration',
    colors: {
      primary: '300 76% 57%',    // Creative magenta
      secondary: '300 20% 85%',  // Light pink-gray
      accent: '330 81% 60%',     // Bright pink
      background: '310 30% 98%', // Soft pink-white
      foreground: '222 84% 5%',  // Dark
      muted: '310 30% 96%',      // Muted pink-white
      border: '310 32% 91%',     // Light pink border
      card: '310 30% 100%',      // Pure white with pink tint
      popover: '310 30% 100%',   // Pure white with pink tint
      destructive: '0 84% 60%',  // Red
      success: '142 76% 55%',    // Green
      warning: '43 96% 56%',     // Yellow
    },
    gradients: {
      main: 'linear-gradient(135deg, hsl(300, 76%, 57%), hsl(330, 81%, 60%))',
      subtle: 'linear-gradient(135deg, hsl(310, 30%, 98%), hsl(300, 20%, 95%))',
      card: 'linear-gradient(135deg, hsl(310, 30%, 100%), hsl(300, 10%, 98%))',
    }
  },
  confident: {
    name: 'Confident',
    emoji: '💪',
    description: 'Bold yellows and golds for empowerment',
    colors: {
      primary: '45 93% 47%',     // Bold yellow
      secondary: '45 20% 85%',   // Light yellow-gray
      accent: '36 100% 50%',     // Golden orange
      background: '50 40% 98%',  // Warm light yellow
      foreground: '222 84% 5%',  // Dark
      muted: '50 40% 96%',       // Muted warm yellow
      border: '50 32% 91%',      // Light yellow border
      card: '50 40% 100%',       // Pure white with yellow tint
      popover: '50 40% 100%',    // Pure white with yellow tint
      destructive: '0 84% 60%',  // Red
      success: '142 76% 55%',    // Green
      warning: '43 96% 56%',     // Yellow
    },
    gradients: {
      main: 'linear-gradient(135deg, hsl(45, 93%, 47%), hsl(36, 100%, 50%))',
      subtle: 'linear-gradient(135deg, hsl(50, 40%, 98%), hsl(45, 20%, 95%))',
      card: 'linear-gradient(135deg, hsl(50, 40%, 100%), hsl(45, 10%, 98%))',
    }
  },
  peaceful: {
    name: 'Peaceful',
    emoji: '🕯️',
    description: 'Soft earth tones for tranquility',
    colors: {
      primary: '159 61% 45%',    // Sage green
      secondary: '159 20% 85%',  // Light sage-gray
      accent: '41 78% 54%',      // Warm earth tone
      background: '160 20% 98%', // Very light sage
      foreground: '222 84% 5%',  // Dark
      muted: '160 20% 96%',      // Muted sage
      border: '160 32% 91%',     // Light sage border
      card: '160 20% 100%',      // Pure white with sage tint
      popover: '160 20% 100%',   // Pure white with sage tint
      destructive: '0 84% 60%',  // Red
      success: '142 76% 55%',    // Green
      warning: '43 96% 56%',     // Yellow
    },
    gradients: {
      main: 'linear-gradient(135deg, hsl(159, 61%, 45%), hsl(41, 78%, 54%))',
      subtle: 'linear-gradient(135deg, hsl(160, 20%, 98%), hsl(159, 20%, 95%))',
      card: 'linear-gradient(135deg, hsl(160, 20%, 100%), hsl(159, 10%, 98%))',
    }
  }
};

interface MoodThemeContextType {
  currentMood: MoodType;
  setMood: (mood: MoodType) => void;
  currentTheme: MoodTheme;
  moodThemes: Record<MoodType, MoodTheme>;
}

const MoodThemeContext = createContext<MoodThemeContextType | undefined>(undefined);

export const useMoodTheme = () => {
  const context = useContext(MoodThemeContext);
  if (!context) {
    throw new Error('useMoodTheme must be used within a MoodThemeProvider');
  }
  return context;
};

interface MoodThemeProviderProps {
  children: React.ReactNode;
}

export const MoodThemeProvider: React.FC<MoodThemeProviderProps> = ({ children }) => {
  const [currentMood, setCurrentMood] = useState<MoodType>(() => {
    const savedMood = localStorage.getItem('userMood');
    return (savedMood as MoodType) || 'calm';
  });

  const setMood = (mood: MoodType) => {
    setCurrentMood(mood);
    localStorage.setItem('userMood', mood);
    applyTheme(moodThemes[mood]);
  };

  const applyTheme = (theme: MoodTheme) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Apply gradient custom properties
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--gradient-${key}`, value);
    });
  };

  useEffect(() => {
    // Apply the current theme on mount
    applyTheme(moodThemes[currentMood]);
  }, [currentMood]);

  const value = {
    currentMood,
    setMood,
    currentTheme: moodThemes[currentMood],
    moodThemes,
  };

  return (
    <MoodThemeContext.Provider value={value}>
      {children}
    </MoodThemeContext.Provider>
  );
};