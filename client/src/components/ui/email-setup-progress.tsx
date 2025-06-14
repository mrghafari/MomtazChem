import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Star, Trophy, Target, Zap, Mail, Settings, Users, TestTube, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EmailCategory {
  id: number;
  categoryKey: string;
  categoryName: string;
  description: string;
  isActive: boolean;
  smtp?: any;
  recipients: any[];
}

interface EmailSetupProgressProps {
  categories: EmailCategory[];
  onSelectCategory: (category: EmailCategory) => void;
  selectedCategory?: EmailCategory;
}

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  points: number;
  isCompleted: boolean;
  category?: string;
}

const achievements = [
  { id: 'first_smtp', title: 'First Connection', icon: <Zap className="w-4 h-4" />, description: 'Configure your first SMTP server', points: 100 },
  { id: 'all_smtp', title: 'Full Coverage', icon: <Shield className="w-4 h-4" />, description: 'Configure SMTP for all categories', points: 300 },
  { id: 'first_test', title: 'Testing Hero', icon: <TestTube className="w-4 h-4" />, description: 'Successfully test an SMTP connection', points: 50 },
  { id: 'all_tests', title: 'Quality Assurance', icon: <Trophy className="w-4 h-4" />, description: 'Test all SMTP configurations', points: 200 },
  { id: 'recipients_added', title: 'Team Builder', icon: <Users className="w-4 h-4" />, description: 'Add recipients to all categories', points: 150 },
  { id: 'master_setup', title: 'Email Master', icon: <Star className="w-4 h-4" />, description: 'Complete all email configurations', points: 500 }
];

export default function EmailSetupProgress({ categories, onSelectCategory, selectedCategory }: EmailSetupProgressProps) {
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedAchievements, setCompletedAchievements] = useState<string[]>([]);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);

  const calculateProgress = () => {
    const steps: ProgressStep[] = [];
    let totalSteps = 0;
    let completedSteps = 0;

    categories.forEach(category => {
      // SMTP Configuration Step
      const smtpCompleted = !!(category.smtp && category.smtp.host && category.smtp.username);
      steps.push({
        id: `smtp_${category.id}`,
        title: `${category.categoryName} SMTP`,
        description: `Configure SMTP settings for ${category.categoryName}`,
        icon: <Settings className="w-4 h-4" />,
        points: 50,
        isCompleted: smtpCompleted,
        category: category.categoryKey
      });

      // SMTP Test Step
      const testCompleted = category.smtp?.testStatus === 'success';
      steps.push({
        id: `test_${category.id}`,
        title: `${category.categoryName} Test`,
        description: `Test SMTP connection for ${category.categoryName}`,
        icon: <TestTube className="w-4 h-4" />,
        points: 25,
        isCompleted: testCompleted,
        category: category.categoryKey
      });

      // Recipients Step
      const recipientsCompleted = category.recipients && category.recipients.length > 0;
      steps.push({
        id: `recipients_${category.id}`,
        title: `${category.categoryName} Recipients`,
        description: `Add email recipients for ${category.categoryName}`,
        icon: <Users className="w-4 h-4" />,
        points: 25,
        isCompleted: recipientsCompleted,
        category: category.categoryKey
      });

      totalSteps += 3;
      if (smtpCompleted) completedSteps++;
      if (testCompleted) completedSteps++;
      if (recipientsCompleted) completedSteps++;
    });

    return { steps, totalSteps, completedSteps };
  };

  const checkAchievements = () => {
    const { steps } = calculateProgress();
    const newAchievements: string[] = [];

    const smtpConfigured = steps.filter(s => s.id.startsWith('smtp_') && s.isCompleted);
    const testsCompleted = steps.filter(s => s.id.startsWith('test_') && s.isCompleted);
    const recipientsAdded = steps.filter(s => s.id.startsWith('recipients_') && s.isCompleted);

    // First SMTP
    if (smtpConfigured.length >= 1 && !completedAchievements.includes('first_smtp')) {
      newAchievements.push('first_smtp');
    }

    // All SMTP
    if (smtpConfigured.length === categories.length && !completedAchievements.includes('all_smtp')) {
      newAchievements.push('all_smtp');
    }

    // First Test
    if (testsCompleted.length >= 1 && !completedAchievements.includes('first_test')) {
      newAchievements.push('first_test');
    }

    // All Tests
    if (testsCompleted.length === categories.length && !completedAchievements.includes('all_tests')) {
      newAchievements.push('all_tests');
    }

    // Recipients Added
    if (recipientsAdded.length === categories.length && !completedAchievements.includes('recipients_added')) {
      newAchievements.push('recipients_added');
    }

    // Master Setup
    const allCompleted = smtpConfigured.length === categories.length && 
                        testsCompleted.length === categories.length && 
                        recipientsAdded.length === categories.length;
    if (allCompleted && !completedAchievements.includes('master_setup')) {
      newAchievements.push('master_setup');
    }

    // Show achievement notification
    if (newAchievements.length > 0) {
      setCompletedAchievements([...completedAchievements, ...newAchievements]);
      setShowAchievement(newAchievements[0]);
      setTimeout(() => setShowAchievement(null), 3000);
    }

    // Calculate points
    const points = [...completedAchievements, ...newAchievements]
      .reduce((total, achId) => {
        const achievement = achievements.find(a => a.id === achId);
        return total + (achievement?.points || 0);
      }, 0);
    
    setTotalPoints(points);
  };

  useEffect(() => {
    checkAchievements();
  }, [categories]);

  const { steps, totalSteps, completedSteps } = calculateProgress();
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const getProgressLevel = () => {
    if (progressPercentage === 100) return { level: 'Master', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (progressPercentage >= 75) return { level: 'Expert', color: 'bg-purple-500', textColor: 'text-purple-700' };
    if (progressPercentage >= 50) return { level: 'Advanced', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (progressPercentage >= 25) return { level: 'Intermediate', color: 'bg-green-500', textColor: 'text-green-700' };
    return { level: 'Beginner', color: 'bg-gray-500', textColor: 'text-gray-700' };
  };

  const level = getProgressLevel();

  return (
    <div className="space-y-6">
      {/* Achievement Notification */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50"
          >
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6" />
                  <div>
                    <div className="font-bold">Achievement Unlocked!</div>
                    <div className="text-sm opacity-90">
                      {achievements.find(a => a.id === showAchievement)?.title}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Email Setup Progress
              </CardTitle>
              <CardDescription>
                Complete all steps to become an Email Configuration Master
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className={`${level.color} text-white`}>
                {level.level}
              </Badge>
              <div className="text-sm text-gray-600 mt-1">
                {totalPoints} points
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{completedSteps}/{totalSteps} completed</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {/* Category Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(category => {
                const categorySteps = steps.filter(s => s.category === category.categoryKey);
                const categoryCompleted = categorySteps.filter(s => s.isCompleted).length;
                const categoryProgress = (categoryCompleted / categorySteps.length) * 100;

                return (
                  <motion.div
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => onSelectCategory(category)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{category.categoryName}</div>
                      <Badge variant={categoryProgress === 100 ? "default" : "secondary"}>
                        {categoryCompleted}/{categorySteps.length}
                      </Badge>
                    </div>
                    <Progress value={categoryProgress} className="h-2" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configuration Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map(step => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  step.isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`flex-shrink-0 ${step.isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  {step.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${step.isCompleted ? 'text-green-800' : 'text-gray-800'}`}>
                    {step.title}
                  </div>
                  <div className={`text-sm ${step.isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                    {step.description}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step.icon}
                  <Badge variant="outline" className="text-xs">
                    {step.points} pts
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(achievement => {
              const isCompleted = completedAchievements.includes(achievement.id);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isCompleted
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 ${isCompleted ? 'text-yellow-600' : 'text-gray-400'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${isCompleted ? 'text-yellow-800' : 'text-gray-800'}`}>
                      {achievement.title}
                    </div>
                    <div className={`text-sm ${isCompleted ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {achievement.description}
                    </div>
                  </div>
                  <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
                    {achievement.points} pts
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}