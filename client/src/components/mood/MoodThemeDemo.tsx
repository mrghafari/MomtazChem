import React from 'react';
import { useMoodTheme } from '@/contexts/MoodThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  Star, 
  Zap, 
  Target, 
  Palette, 
  Mountain,
  ShoppingCart,
  User,
  Mail,
  Phone
} from 'lucide-react';

const MoodThemeDemo: React.FC = () => {
  const { currentTheme } = useMoodTheme();

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          Current Theme: {currentTheme.emoji} {currentTheme.name}
        </h1>
        <p className="text-muted-foreground mb-6">
          {currentTheme.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Color Showcase Card */}
        <Card className="relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-5"
            style={{ background: 'var(--gradient-main)' }}
          />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Palette
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div 
                  className="w-full h-12 rounded-md border-2 border-white shadow-sm mb-1"
                  style={{ backgroundColor: `hsl(var(--primary))` }}
                />
                <p className="text-xs">Primary</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-12 rounded-md border-2 border-white shadow-sm mb-1"
                  style={{ backgroundColor: `hsl(var(--secondary))` }}
                />
                <p className="text-xs">Secondary</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-full h-12 rounded-md border-2 border-white shadow-sm mb-1"
                  style={{ backgroundColor: `hsl(var(--accent))` }}
                />
                <p className="text-xs">Accent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Showcase */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Interactive Elements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full">
              Primary Button
            </Button>
            <Button variant="secondary" className="w-full">
              Secondary Button
            </Button>
            <Button variant="outline" className="w-full">
              Outline Button
            </Button>
            <div className="flex gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Alert</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Progress & Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progress & Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Mood Level</Label>
              <Progress value={85} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Energy</Label>
              <Progress value={60} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Focus</Label>
              <Progress value={70} className="mt-1" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Theme Active</span>
              <Badge variant="outline">
                <Heart className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Form Elements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            <Button className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Submit Form
            </Button>
          </CardContent>
        </Card>

        {/* Gradient Showcase */}
        <Card className="relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-10"
            style={{ background: 'var(--gradient-main)' }}
          />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <Mountain className="h-5 w-5" />
              Gradient Effects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div 
              className="h-20 rounded-lg p-4 flex items-center justify-center text-white font-semibold"
              style={{ background: 'var(--gradient-main)' }}
            >
              Main Gradient
            </div>
            <div 
              className="h-16 rounded-lg p-3 flex items-center justify-center border"
              style={{ background: 'var(--gradient-subtle)' }}
            >
              Subtle Gradient
            </div>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card className="relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-5"
            style={{ background: 'var(--gradient-card)' }}
          />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <Button variant="outline" className="w-full justify-start">
              <Star className="h-4 w-4 mr-2" />
              Add to Favorites
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Phone className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Palette className="h-4 w-4 mr-2" />
              Change Theme
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-2xl mb-2">
            {currentTheme.emoji}
            <span className="text-lg font-semibold">
              {currentTheme.name} Theme Active
            </span>
          </div>
          <p className="text-muted-foreground">
            Your interface adapts to your mood for a better experience
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MoodThemeDemo;