import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  TrendingUp, 
  Eye, 
  Clock, 
  Users, 
  BarChart3, 
  Heart, 
  X, 
  Plus,
  Activity,
  Target,
  Zap,
  Grid3X3,
  Settings
} from 'lucide-react';

interface DashboardWidget {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  iconName: string;
  isActive: boolean;
  priority: number;
  minUserLevel: string;
}

interface WidgetRecommendation {
  id: number;
  userId: number;
  widgetId: number;
  score: string;
  reason: string;
  explanation: string;
  isAccepted: boolean | null;
  isDismissed: boolean;
  generatedAt: string;
  expiresAt: string | null;
  metadata: any;
}

interface UserActivitySummary {
  mostUsedWidgets: Array<{
    widgetId: number;
    widgetName: string;
    usage: number;
  }>;
  totalInteractions: number;
  averageSessionTime: number;
  preferredCategories: Array<{
    category: string;
    usage: number;
  }>;
}

interface PopularWidget {
  widget: DashboardWidget;
  usageCount: number;
  uniqueUsers: number;
  averageRating: number;
}

const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: React.ComponentType<any> } = {
    BarChart3,
    TrendingUp,
    Users,
    Activity,
    Target,
    Zap,
    Grid3X3,
    Settings,
    Heart,
    Eye,
    Clock,
    Star
  };
  return icons[iconName] || BarChart3;
};

const categoryColors: { [key: string]: string } = {
  'analytics': 'bg-blue-100 text-blue-800',
  'sales': 'bg-green-100 text-green-800',
  'customers': 'bg-purple-100 text-purple-800',
  'inventory': 'bg-orange-100 text-orange-800',
  'system': 'bg-gray-100 text-gray-800'
};

const reasonLabels: { [key: string]: string } = {
  'role_based': 'Role Match',
  'usage_pattern': 'Usage Pattern',
  'trending': 'Trending',
  'similar_users': 'Similar Users'
};

export default function WidgetRecommendations() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recommendations
  const { data: recommendations, isLoading: loadingRecommendations } = useQuery({
    queryKey: ['/api/admin/widgets/recommendations'],
    enabled: activeTab === 'recommendations'
  });

  // Fetch popular widgets
  const { data: popularWidgets, isLoading: loadingPopular } = useQuery({
    queryKey: ['/api/admin/widgets/popular'],
    enabled: activeTab === 'popular'
  });

  // Fetch user activity
  const { data: userActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['/api/admin/widgets/activity'],
    enabled: activeTab === 'activity'
  });

  // Fetch available widgets
  const { data: availableWidgets } = useQuery({
    queryKey: ['/api/admin/widgets']
  });

  // Generate recommendations mutation
  const generateRecommendations = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/widgets/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to generate recommendations');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Recommendations Generated",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets/recommendations'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate recommendations",
        variant: "destructive"
      });
    }
  });

  // Accept recommendation mutation
  const acceptRecommendation = useMutation({
    mutationFn: async (recommendationId: number) => {
      const response = await fetch(`/api/admin/widgets/recommendations/${recommendationId}/accept`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to accept recommendation');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Widget Added",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets/recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets/preferences'] });
    }
  });

  // Dismiss recommendation mutation
  const dismissRecommendation = useMutation({
    mutationFn: async (recommendationId: number) => {
      const response = await fetch(`/api/admin/widgets/recommendations/${recommendationId}/dismiss`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to dismiss recommendation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Recommendation Dismissed",
        description: "The recommendation has been removed"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets/recommendations'] });
    }
  });

  // Track widget interaction
  const trackInteraction = async (widgetId: number, action: string) => {
    try {
      await fetch(`/api/admin/widgets/${widgetId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          sessionId: sessionStorage.getItem('sessionId') || 'default'
        })
      });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const RecommendationCard = ({ recommendation }: { recommendation: WidgetRecommendation }) => {
    const widget = availableWidgets?.data?.find((w: DashboardWidget) => w.id === recommendation.widgetId);
    if (!widget) return null;

    const IconComponent = getIconComponent(widget.iconName);
    const score = parseFloat(recommendation.score);

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <IconComponent className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{widget.displayName}</CardTitle>
                <CardDescription className="text-sm">
                  {widget.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={categoryColors[widget.category] || 'bg-gray-100 text-gray-800'}>
                {widget.category}
              </Badge>
              <Badge variant="outline">
                {reasonLabels[recommendation.reason] || recommendation.reason}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Recommendation Score</span>
                <span className="text-sm text-gray-600">{score}%</span>
              </div>
              <Progress value={score} className="h-2" />
            </div>
            
            <p className="text-sm text-gray-600">
              {recommendation.explanation}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Priority: {widget.priority}</span>
                <span>•</span>
                <span>Generated: {new Date(recommendation.generatedAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    dismissRecommendation.mutate(recommendation.id);
                    trackInteraction(widget.id, 'dismiss_recommendation');
                  }}
                  disabled={dismissRecommendation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    acceptRecommendation.mutate(recommendation.id);
                    trackInteraction(widget.id, 'accept_recommendation');
                  }}
                  disabled={acceptRecommendation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Widget
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const PopularWidgetCard = ({ popularWidget }: { popularWidget: PopularWidget }) => {
    const { widget } = popularWidget;
    const IconComponent = getIconComponent(widget.iconName);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <IconComponent className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{widget.displayName}</CardTitle>
              <CardDescription>{widget.description}</CardDescription>
            </div>
            <Badge className={categoryColors[widget.category] || 'bg-gray-100 text-gray-800'}>
              {widget.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{popularWidget.usageCount}</div>
              <div className="text-xs text-gray-500">Total Uses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{popularWidget.uniqueUsers}</div>
              <div className="text-xs text-gray-500">Users</div>
            </div>
            <div>
              <div className="flex items-center justify-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-lg font-bold">{popularWidget.averageRating}</span>
              </div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Widget Recommendations</h1>
        <p className="text-gray-600 mt-2">
          Discover personalized dashboard widgets based on your usage patterns and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">
            <Target className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="popular">
            <TrendingUp className="h-4 w-4 mr-2" />
            Popular Widgets
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            My Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Personalized Recommendations</h2>
              <p className="text-gray-600">Widgets tailored to your role and usage patterns</p>
            </div>
            <Button 
              onClick={() => generateRecommendations.mutate()}
              disabled={generateRecommendations.isPending}
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate New
            </Button>
          </div>

          {loadingRecommendations ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations?.data?.length > 0 ? (
            <div>
              {recommendations.data.map((recommendation: WidgetRecommendation) => (
                <RecommendationCard key={recommendation.id} recommendation={recommendation} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations</h3>
                <p className="text-gray-600 text-center mb-4">
                  Generate personalized recommendations based on your usage patterns
                </p>
                <Button onClick={() => generateRecommendations.mutate()}>
                  Generate Recommendations
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Popular Widgets</h2>
            <p className="text-gray-600">Most used widgets across all users</p>
          </div>

          {loadingPopular ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="text-center">
                          <div className="h-6 bg-gray-200 rounded mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : popularWidgets?.data?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularWidgets.data.map((popularWidget: PopularWidget) => (
                <PopularWidgetCard key={popularWidget.widget.id} popularWidget={popularWidget} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Popular Widgets</h3>
                <p className="text-gray-600 text-center">
                  Popular widgets will appear here once usage data is available
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">My Activity Summary</h2>
            <p className="text-gray-600">Your widget usage patterns and preferences</p>
          </div>

          {loadingActivity ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : userActivity?.data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-blue-600" />
                    Most Used Widgets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userActivity.data.mostUsedWidgets?.length > 0 ? (
                    <div className="space-y-3">
                      {userActivity.data.mostUsedWidgets.map((widget: any, index: number) => (
                        <div key={widget.widgetId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500">#{index + 1}</span>
                            <span className="font-medium">{widget.widgetName}</span>
                          </div>
                          <Badge variant="secondary">{widget.usage} uses</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No usage data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Grid3X3 className="h-5 w-5 mr-2 text-purple-600" />
                    Preferred Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userActivity.data.preferredCategories?.length > 0 ? (
                    <div className="space-y-3">
                      {userActivity.data.preferredCategories.map((category: any) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <span className="font-medium">{category.category}</span>
                          <Badge 
                            className={categoryColors[category.category] || 'bg-gray-100 text-gray-800'}
                          >
                            {category.usage} uses
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No category data available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-600" />
                    Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userActivity.data.totalInteractions || 0}
                      </div>
                      <div className="text-sm text-gray-500">Total Interactions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(userActivity.data.averageSessionTime || 0)}s
                      </div>
                      <div className="text-sm text-gray-500">Avg Session Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {userActivity.data.mostUsedWidgets?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Active Widgets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {userActivity.data.preferredCategories?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Categories Used</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Data</h3>
                <p className="text-gray-600 text-center">
                  Start using dashboard widgets to see your activity summary
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}