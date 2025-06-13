import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Mail, Settings, AlertTriangle, Zap, Eye, EyeOff } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
}

interface EmailProvider {
  name: string;
  domains: string[];
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
  instructions: string[];
  appPasswordRequired: boolean;
}

interface ValidationResult {
  isValid: boolean;
  provider?: EmailProvider;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  configurationStatus: {
    hostReachable: boolean;
    portOpen: boolean;
    tlsSupported: boolean;
    authenticationWorking: boolean;
  };
}

export default function SMTPTestPage() {
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [emailResult, setEmailResult] = useState<TestResult | null>(null);
  const [testEmail, setTestEmail] = useState('info@momtazchem.com');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // One-click validator state
  const [validatorEmail, setValidatorEmail] = useState('');
  const [validatorPassword, setValidatorPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customHost, setCustomHost] = useState('');
  const [customPort, setCustomPort] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [detectedProvider, setDetectedProvider] = useState<EmailProvider | null>(null);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);
    
    try {
      const response = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      setConnectionResult(result);
    } catch (error: any) {
      setConnectionResult({
        success: false,
        message: error.message || 'Failed to test SMTP connection'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      setEmailResult({
        success: false,
        message: 'Please enter a valid email address'
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailResult(null);
    
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      setEmailResult(result);
    } catch (error: any) {
      setEmailResult({
        success: false,
        message: error.message || 'Failed to send test email'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // One-click validator functions
  const detectEmailProvider = async (email: string) => {
    if (!email.includes('@')) return;

    try {
      const response = await fetch('/api/admin/detect-provider', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (result.success && result.provider) {
        setDetectedProvider(result.provider);
        setCustomHost(result.recommendedConfig.host);
        setCustomPort(result.recommendedConfig.port.toString());
      } else {
        setDetectedProvider(null);
      }
    } catch (error) {
      console.error('Error detecting provider:', error);
    }
  };

  const validateSMTPConfiguration = async () => {
    if (!validatorEmail.trim() || !validatorPassword.trim()) {
      setValidationResult({
        isValid: false,
        errors: ['Email and password are required'],
        warnings: [],
        suggestions: [],
        configurationStatus: {
          hostReachable: false,
          portOpen: false,
          tlsSupported: false,
          authenticationWorking: false,
        },
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/admin/validate-smtp', {
        method: 'POST',
        body: JSON.stringify({
          email: validatorEmail,
          password: validatorPassword,
          customHost: customHost || undefined,
          customPort: customPort ? parseInt(customPort) : undefined,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setValidationResult(result);
    } catch (error: any) {
      setValidationResult({
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        suggestions: [],
        configurationStatus: {
          hostReachable: false,
          portOpen: false,
          tlsSupported: false,
          authenticationWorking: false,
        },
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleEmailChange = (email: string) => {
    setValidatorEmail(email);
    if (email.includes('@')) {
      detectEmailProvider(email);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h1 className="text-3xl font-bold">SMTP Configuration & Validation</h1>
      </div>

      <Tabs defaultValue="validator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="validator" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            One-Click Validator
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Manual Testing
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Setup Guide
          </TabsTrigger>
        </TabsList>

        {/* One-Click SMTP Validator Tab */}
        <TabsContent value="validator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                One-Click SMTP Configuration Validator
              </CardTitle>
              <CardDescription>
                Automatically detect your email provider and validate SMTP settings in one click
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validatorEmail">Email Address</Label>
                  <Input
                    id="validatorEmail"
                    type="email"
                    placeholder="your-email@example.com"
                    value={validatorEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                  />
                  {detectedProvider && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Detected: {detectedProvider.name}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validatorPassword">Password / App Password</Label>
                  <div className="relative">
                    <Input
                      id="validatorPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your app password"
                      value={validatorPassword}
                      onChange={(e) => setValidatorPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {detectedProvider && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  <AlertDescription>
                    <strong>{detectedProvider.name} detected:</strong> {detectedProvider.appPasswordRequired ? 'Use an App Password instead of your regular password.' : 'You can use your regular email password.'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customHost">SMTP Host (Optional)</Label>
                  <Input
                    id="customHost"
                    placeholder="smtp.example.com"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customPort">SMTP Port (Optional)</Label>
                  <Input
                    id="customPort"
                    placeholder="587"
                    value={customPort}
                    onChange={(e) => setCustomPort(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={validateSMTPConfiguration}
                disabled={isValidating || !validatorEmail.trim() || !validatorPassword.trim()}
                className="w-full md:w-auto"
                size="lg"
              >
                {isValidating ? 'Validating...' : 'Validate Configuration'}
              </Button>

              {validationResult && (
                <div className="space-y-4">
                  <Alert className={validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <div className="flex items-center gap-2">
                      {validationResult.isValid ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <Badge variant={validationResult.isValid ? 'default' : 'destructive'}>
                        {validationResult.isValid ? 'Configuration Valid' : 'Configuration Failed'}
                      </Badge>
                    </div>
                  </Alert>

                  {/* Configuration Status Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {validationResult.configurationStatus.hostReachable ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">Host Reachable</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {validationResult.configurationStatus.portOpen ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">Port Open</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {validationResult.configurationStatus.tlsSupported ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">TLS Support</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {validationResult.configurationStatus.authenticationWorking ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">Authentication</span>
                    </div>
                  </div>

                  {/* Errors */}
                  {validationResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600">Errors:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                        {validationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-yellow-600">Warnings:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-yellow-600">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {validationResult.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-600">Suggestions:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                        {validationResult.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Provider Instructions */}
                  {validationResult.provider && !validationResult.isValid && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">
                        {validationResult.provider.name} Setup Instructions:
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                        {validationResult.provider.instructions.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Testing Tab */}
        <TabsContent value="manual" className="space-y-6">
          {/* Configuration Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Current SMTP Configuration
              </CardTitle>
              <CardDescription>
                Review and test your current email settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connection Test */}
              <div className="space-y-4">
                <Button 
                  onClick={testConnection}
                  disabled={isTestingConnection}
                  className="w-full md:w-auto"
                >
                  {isTestingConnection ? 'Testing...' : 'Test SMTP Connection'}
                </Button>

                {connectionResult && (
                  <Alert className={connectionResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <div className="flex items-center gap-2">
                      {connectionResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <Badge variant={connectionResult.success ? 'default' : 'destructive'}>
                        {connectionResult.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    <AlertDescription className="mt-2">
                      {connectionResult.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Email Test */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Test Email Address</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                <Button 
                  onClick={sendTestEmail}
                  disabled={isSendingEmail || !testEmail.trim()}
                  className="w-full md:w-auto"
                >
                  {isSendingEmail ? 'Sending...' : 'Send Test Email'}
                </Button>

                {emailResult && (
                  <Alert className={emailResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <div className="flex items-center gap-2">
                      {emailResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <Badge variant={emailResult.success ? 'default' : 'destructive'}>
                        {emailResult.success ? 'Sent' : 'Failed'}
                      </Badge>
                    </div>
                    <AlertDescription className="mt-2">
                      {emailResult.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup Guide Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Setup Guide</CardTitle>
              <CardDescription>
                Complete instructions for configuring email providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Required Environment Variables:</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>SMTP_HOST=smtp.zoho.com</div>
                  <div>SMTP_PORT=587</div>
                  <div>SMTP_USER=info@momtazchem.com</div>
                  <div>SMTP_PASS=[Your App Password]</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Zoho Mail Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Log in to your Zoho Mail account</li>
                  <li>Go to Account Settings → Security</li>
                  <li>Enable Two-Factor Authentication if not already enabled</li>
                  <li>Navigate to App Passwords section</li>
                  <li>Generate a new App Password for "Momtazchem Website"</li>
                  <li>Copy the generated password and use it as SMTP_PASS</li>
                </ol>
              </div>

              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  For Zoho Mail, make sure to use an App Password instead of your regular password. 
                  Enable Two-Factor Authentication in your Zoho account and generate an App Password 
                  specifically for this application.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}