import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const { mutate: requestPasswordReset, isPending } = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("/api/customers/password-reset-request", {
        method: "POST",
        body: { email },
      });
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      toast({
        title: "Success",
        description: data.message || "Password reset link sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset link",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    if (!email.includes("@")) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    requestPasswordReset(email);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                If an account with the email address <strong>{email}</strong> exists, 
                you will receive a password reset link shortly.
              </AlertDescription>
            </Alert>
            
            <div className="text-center text-sm text-gray-600">
              <p>Didn't receive the email? Check your spam folder or</p>
              <Button
                variant="link"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
                className="p-0 h-auto"
              >
                try again
              </Button>
            </div>
            
            <div className="pt-4">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "Sending..." : "Send Reset Link"}
            </Button>
            
            <div className="text-center">
              <Link href="/login">
                <Button variant="link" className="p-0">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}