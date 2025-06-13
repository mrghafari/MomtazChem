import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Mail, Settings, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TestResult {
  success: boolean;
  message: string;
}

export default function SMTPTestPage() {
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [emailResult, setEmailResult] = useState<TestResult | null>(null);
  const [testEmail, setTestEmail] = useState('info@momtazchem.com');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h1 className="text-3xl font-bold">SMTP Configuration Test</h1>
      </div>

      {/* Configuration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Zoho Mail SMTP Settings
          </CardTitle>
          <CardDescription>
            Current configuration for Momtazchem email services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">SMTP Host</Label>
              <p className="text-sm bg-gray-50 p-2 rounded border">
                {process.env.SMTP_HOST || 'smtp.zoho.com'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">SMTP Port</Label>
              <p className="text-sm bg-gray-50 p-2 rounded border">
                {process.env.SMTP_PORT || '587'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">SMTP User</Label>
              <p className="text-sm bg-gray-50 p-2 rounded border">
                {process.env.SMTP_USER || 'Not configured'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Authentication</Label>
              <p className="text-sm bg-gray-50 p-2 rounded border">
                {process.env.SMTP_PASS ? 'App Password Set' : 'Not configured'}
              </p>
            </div>
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

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle>Test SMTP Connection</CardTitle>
          <CardDescription>
            Verify that the server can connect to Zoho Mail SMTP servers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testConnection}
            disabled={isTestingConnection}
            className="w-full md:w-auto"
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
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
        </CardContent>
      </Card>

      <Separator />

      {/* Email Test */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Send a test email to verify the complete email functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to configure SMTP environment variables for Zoho Mail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Required Environment Variables:</h4>
            <div className="space-y-1 text-sm font-mono">
              <div>SMTP_HOST=smtp.zoho.com</div>
              <div>SMTP_PORT=587</div>
              <div>SMTP_USER=info@momtazchem.com</div>
              <div>SMTP_PASS=[Your App Password]</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Steps to get Zoho App Password:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Log in to your Zoho Mail account</li>
              <li>Go to Account Settings → Security</li>
              <li>Enable Two-Factor Authentication if not already enabled</li>
              <li>Navigate to App Passwords section</li>
              <li>Generate a new App Password for "Momtazchem Website"</li>
              <li>Copy the generated password and use it as SMTP_PASS</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}