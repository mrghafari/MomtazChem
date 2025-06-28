import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Loader2, Sparkles, CheckCircle, ArrowRight, MessageCircle, Star, DollarSign, Package, AlertCircle } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

interface RecommendationRequest {
  industry: string;
  application: string;
  requirements: string;
  budget?: string;
  environmentalConcerns?: string;
  quantity?: string;
  urgency?: string;
}

interface ProductRecommendation {
  productId: number;
  name: string;
  category: string;
  price: number;
  description: string;
  matchScore: number;
  reasonForRecommendation: string;
  alternativeUses?: string[];
  compatibilityNotes?: string;
}

interface RecommendationResponse {
  recommendations: ProductRecommendation[];
  summary: string;
  additionalAdvice?: string;
  followUpQuestions?: string[];
}

const INDUSTRIES = [
  "Manufacturing",
  "Oil & Gas",
  "Water Treatment",
  "Agriculture",
  "Food Processing",
  "Pharmaceuticals",
  "Textiles",
  "Automotive",
  "Construction",
  "Mining",
  "Paper & Pulp",
  "Electronics",
  "Other"
];

const APPLICATIONS = [
  "Cleaning & Degreasing",
  "Water Purification",
  "Fuel Enhancement",
  "Corrosion Protection",
  "Paint & Coating",
  "Fertilization",
  "pH Adjustment",
  "Disinfection",
  "Scale Prevention",
  "Catalysis",
  "Solvent Applications",
  "Laboratory Use",
  "Other"
];

const BUDGET_RANGES = [
  "Under $1,000",
  "$1,000 - $5,000",
  "$5,000 - $10,000",
  "$10,000 - $25,000",
  "$25,000 - $50,000",
  "Over $50,000",
  "Budget Flexible"
];

const URGENCY_LEVELS = [
  "Immediate (1-3 days)",
  "Urgent (1 week)",
  "Standard (2-4 weeks)",
  "Planned (1-3 months)",
  "Future Planning"
];

export default function ProductRecommendationWizard() {
  const { t, direction } = useLanguage();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [request, setRequest] = useState<RecommendationRequest>({
    industry: "",
    application: "",
    requirements: "",
    budget: "",
    environmentalConcerns: "",
    quantity: "",
    urgency: ""
  });
  
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");

  const handleAnalyze = async () => {
    if (!request.industry || !request.application || !request.requirements) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("/api/recommendations/analyze", "POST", request);

      if (response.success) {
        setRecommendations(response.data);
        setStep(3);
      } else {
        throw new Error(response.message || "Failed to get recommendations");
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze your requirements. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !recommendations) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("/api/recommendations/follow-up", "POST", {
        originalRequest: request,
        previousRecommendations: recommendations.recommendations,
        newInformation: followUpQuestion
      });

      if (response.success) {
        // Merge new recommendations with existing ones
        setRecommendations(prev => ({
          ...prev!,
          recommendations: [...prev!.recommendations, ...response.data.recommendations],
          summary: response.data.summary,
          additionalAdvice: response.data.additionalAdvice,
          followUpQuestions: response.data.followUpQuestions
        }));
        setFollowUpQuestion("");
        toast({
          title: "Updated Recommendations",
          description: "New recommendations based on your additional information.",
        });
      }
    } catch (error) {
      console.error("Error getting follow-up recommendations:", error);
      toast({
        title: "Follow-up Failed",
        description: "Failed to get updated recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">AI Product Recommendation Wizard</CardTitle>
        <CardDescription>
          Get personalized chemical product recommendations based on your specific needs and requirements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="industry">Industry *</Label>
            <Select value={request.industry} onValueChange={(value) => setRequest(prev => ({...prev, industry: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="application">Application Type *</Label>
            <Select value={request.application} onValueChange={(value) => setRequest(prev => ({...prev, application: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select application type" />
              </SelectTrigger>
              <SelectContent>
                {APPLICATIONS.map(app => (
                  <SelectItem key={app} value={app}>{app}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="requirements">Specific Requirements *</Label>
          <Textarea
            id="requirements"
            placeholder="Describe your specific needs, performance requirements, operating conditions, etc."
            value={request.requirements}
            onChange={(e) => setRequest(prev => ({...prev, requirements: e.target.value}))}
            rows={4}
          />
        </div>

        <Button onClick={() => setStep(2)} className="w-full" size="lg">
          Continue to Details
          <ArrowRight className={`h-4 w-4 ${direction === 'rtl' ? 'mr-2' : 'ml-2'}`} />
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Additional Details (Optional)</CardTitle>
        <CardDescription>
          Provide more details to get more accurate recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Budget Range</Label>
            <Select value={request.budget} onValueChange={(value) => setRequest(prev => ({...prev, budget: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_RANGES.map(budget => (
                  <SelectItem key={budget} value={budget}>{budget}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="urgency">Timeline</Label>
            <Select value={request.urgency} onValueChange={(value) => setRequest(prev => ({...prev, urgency: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent>
                {URGENCY_LEVELS.map(urgency => (
                  <SelectItem key={urgency} value={urgency}>{urgency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="quantity">Quantity/Volume Needed</Label>
          <Input
            id="quantity"
            placeholder="e.g., 500 liters, 10 tons, ongoing supply"
            value={request.quantity}
            onChange={(e) => setRequest(prev => ({...prev, quantity: e.target.value}))}
          />
        </div>

        <div>
          <Label htmlFor="environmental">Environmental Considerations</Label>
          <Textarea
            id="environmental"
            placeholder="Any environmental requirements, regulations, or sustainability concerns"
            value={request.environmentalConcerns}
            onChange={(e) => setRequest(prev => ({...prev, environmentalConcerns: e.target.value}))}
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
            Back
          </Button>
          <Button onClick={handleAnalyze} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Recommendations
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderRecommendations = () => (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            AI Analysis Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{recommendations?.summary}</p>
          {recommendations?.additionalAdvice && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Additional Advice</h4>
              <p className="text-blue-800">{recommendations.additionalAdvice}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid gap-4">
        {recommendations?.recommendations.map((rec, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{rec.name}</h3>
                  <Badge variant="secondary" className="mt-1">{rec.category}</Badge>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-bold text-lg">{rec.matchScore}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                    <DollarSign className="h-4 w-4" />
                    {rec.price}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{rec.description}</p>

              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-green-900 mb-2">Why This Product is Recommended</h4>
                <p className="text-green-800">{rec.reasonForRecommendation}</p>
              </div>

              {rec.alternativeUses && rec.alternativeUses.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Alternative Uses</h4>
                  <div className="flex flex-wrap gap-2">
                    {rec.alternativeUses.map((use, i) => (
                      <Badge key={i} variant="outline">{use}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {rec.compatibilityNotes && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Important Notes</span>
                  </div>
                  <p className="text-yellow-800 mt-1">{rec.compatibilityNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Follow-up Questions */}
      {recommendations?.followUpQuestions && recommendations.followUpQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Have More Questions?
            </CardTitle>
            <CardDescription>
              Answer these questions to get even more specific recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {recommendations.followUpQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto py-3 px-4"
                  onClick={() => setFollowUpQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="follow-up">Or ask your own question:</Label>
              <Textarea
                id="follow-up"
                placeholder="Ask for more specific recommendations or clarify your requirements..."
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                rows={3}
              />
              <Button onClick={handleFollowUp} disabled={!followUpQuestion.trim() || isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting Additional Recommendations...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get More Recommendations
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Over */}
      <div className="text-center">
        <Button variant="outline" onClick={() => {
          setStep(1);
          setRecommendations(null);
          setRequest({
            industry: "",
            application: "",
            requirements: "",
            budget: "",
            environmentalConcerns: "",
            quantity: "",
            urgency: ""
          });
        }}>
          Start New Analysis
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 py-12 px-4 ${direction === 'rtl' ? 'rtl' : 'ltr'}`} dir={direction}>
      <div className="container mx-auto">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Requirements</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Details</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Recommendations</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderRecommendations()}
      </div>
    </div>
  );
}