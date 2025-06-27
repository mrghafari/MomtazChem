import React, { useState } from 'react';
import { useMoodTheme, type MoodType } from '@/contexts/MoodThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const MoodSelector: React.FC = () => {
  const { currentMood, setMood, moodThemes } = useMoodTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [previewMood, setPreviewMood] = useState<MoodType | null>(null);

  const handleMoodSelect = (mood: MoodType) => {
    setMood(mood);
    setPreviewMood(null);
    setIsOpen(false);
  };

  const handlePreview = (mood: MoodType) => {
    setPreviewMood(mood);
    // Temporarily apply theme for preview
    const root = document.documentElement;
    const theme = moodThemes[mood];
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--gradient-${key}`, value);
    });
  };

  const handleStopPreview = () => {
    setPreviewMood(null);
    // Restore current theme
    const theme = moodThemes[currentMood];
    const root = document.documentElement;
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--gradient-${key}`, value);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 relative overflow-hidden"
          style={{
            background: `var(--gradient-subtle)`,
            borderColor: `hsl(var(--border))`,
          }}
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">
            {moodThemes[currentMood].emoji} {moodThemes[currentMood].name}
          </span>
          <span className="sm:hidden">
            {moodThemes[currentMood].emoji}
          </span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Choose Your Mood Theme
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Select a theme that matches your current mood or desired atmosphere
          </div>
          
          {previewMood && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-muted rounded-lg"
            >
              <div>Previewing: {moodThemes[previewMood].emoji} {moodThemes[previewMood].name}</div>
              <Button size="sm" variant="outline" onClick={handleStopPreview}>
                Stop Preview
              </Button>
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {Object.entries(moodThemes).map(([mood, theme], index) => (
                <motion.div
                  key={mood}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg relative overflow-hidden group",
                      currentMood === mood && "ring-2 ring-primary",
                      previewMood === mood && "ring-2 ring-accent"
                    )}
                    onMouseEnter={() => handlePreview(mood as MoodType)}
                    onMouseLeave={handleStopPreview}
                    onClick={() => handleMoodSelect(mood as MoodType)}
                  >
                    {/* Gradient Background */}
                    <div 
                      className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ background: theme.gradients.main }}
                    />
                    
                    <CardHeader className="pb-2 relative z-10">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="flex items-center gap-2">
                          <span className="text-2xl">{theme.emoji}</span>
                          {theme.name}
                        </span>
                        {currentMood === mood && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 relative z-10">
                      <p className="text-sm text-muted-foreground">
                        {theme.description}
                      </p>
                      
                      {/* Color Preview */}
                      <div className="flex gap-1">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                        />
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoodSelect(mood as MoodType);
                          }}
                          className="flex-1"
                          variant={currentMood === mood ? "default" : "outline"}
                        >
                          {currentMood === mood ? "Current" : "Apply"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(mood as MoodType);
                          }}
                        >
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Your mood theme preference is saved automatically
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoodSelector;