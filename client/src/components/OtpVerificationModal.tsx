import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, RefreshCw, Mail, Smartphone, MessageSquare } from "lucide-react";

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  email: string;
  onVerified: (registrationData: any) => void;
  initialSentVia?: { whatsapp: boolean; sms: boolean; email: boolean };
}

export function OtpVerificationModal({
  isOpen,
  onClose,
  phone,
  email,
  onVerified,
  initialSentVia,
}: OtpVerificationModalProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [sentVia, setSentVia] = useState<{ whatsapp: boolean; sms: boolean; email: boolean }>(
    initialSentVia || {
      whatsapp: false,
      sms: false,
      email: false,
    }
  );

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeRemaining]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiRequest("/api/customers/verify-otp", {
        method: "POST",
        body: { phone, email, code },
      });

      if (response.success) {
        toast({
          title: "Verification Successful",
          description: "Your account has been verified successfully!",
        });
        onVerified(response.registrationData);
      }
    } catch (error: any) {
      if (error.message?.includes("expired")) {
        toast({
          title: "Code Expired",
          description: "Your verification code has expired. Please request a new one.",
          variant: "destructive",
        });
        setCanResend(true);
      } else if (error.message?.includes("Invalid")) {
        const attemptsLeft = error.attemptsRemaining ?? attemptsRemaining - 1;
        setAttemptsRemaining(attemptsLeft);
        toast({
          title: "Invalid Code",
          description: `Incorrect code. ${attemptsLeft} attempts remaining.`,
          variant: "destructive",
        });
      } else if (error.message?.includes("Maximum")) {
        toast({
          title: "Too Many Attempts",
          description: "Maximum verification attempts exceeded. Please request a new code.",
          variant: "destructive",
        });
        setCanResend(true);
      } else {
        toast({
          title: "Verification Failed",
          description: error.message || "Failed to verify code. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) {
      toast({
        title: "Please Wait",
        description: `You can request a new code in ${resendCooldown} seconds`,
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await apiRequest("/api/customers/resend-otp", {
        method: "POST",
        body: { phone, email },
      });

      if (response.success) {
        setTimeRemaining(300); // Reset to 5 minutes
        setCanResend(false);
        setCode("");
        setAttemptsRemaining(3);
        setSentVia(response.sentVia || { whatsapp: false, sms: false, email: false });
        
        if (response.retryAfter) {
          setResendCooldown(response.retryAfter);
        } else {
          setResendCooldown(60); // Default 1 minute cooldown
        }

        const channels = [];
        if (response.sentVia?.email) channels.push("Email");
        if (response.sentVia?.whatsapp) channels.push("WhatsApp");
        if (response.sentVia?.sms) channels.push("SMS");

        toast({
          title: "Code Resent",
          description: `New verification code sent via ${channels.join(", ")}`,
        });
      }
    } catch (error: any) {
      if (error.retryAfter) {
        setResendCooldown(error.retryAfter);
        toast({
          title: "Please Wait",
          description: `Please wait ${error.retryAfter} seconds before requesting a new code`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Resend",
          description: error.message || "Failed to resend verification code",
          variant: "destructive",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  // Get sent channels display
  const getSentChannels = () => {
    const channels = [];
    if (sentVia.email) channels.push({ icon: <Mail className="h-4 w-4" />, name: "Email" });
    if (sentVia.whatsapp) channels.push({ icon: <MessageSquare className="h-4 w-4" />, name: "WhatsApp" });
    if (sentVia.sms) channels.push({ icon: <Smartphone className="h-4 w-4" />, name: "SMS" });
    return channels;
  };

  const sentChannels = getSentChannels();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="ltr">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Verify Your Account</DialogTitle>
          <DialogDescription className="text-center">
            We've sent a 6-digit verification code to:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Info Display */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-mono">{phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-mono">{email}</span>
            </div>
          </div>

          {/* Sent Channels Display */}
          {sentChannels.length > 0 && (
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>Sent via:</span>
              {sentChannels.map((channel, index) => (
                <div key={index} className="flex items-center gap-1">
                  {channel.icon}
                  <span>{channel.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* OTP Input */}
          <div className="space-y-2">
            <Label htmlFor="otp-code">Verification Code</Label>
            <Input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-widest"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleVerify();
                }
              }}
            />
          </div>

          {/* Timer and Attempts */}
          <div className="flex items-center justify-between text-sm">
            <div className={`font-medium ${timeRemaining < 60 ? "text-red-600" : "text-gray-600"}`}>
              ⏰ Expires in: {formatTime(timeRemaining)}
            </div>
            <div className="text-gray-600">
              🔢 Attempts: {attemptsRemaining}/3
            </div>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6 || timeRemaining === 0}
            className="w-full"
            data-testid="button-verify-otp"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>

          {/* Resend Button */}
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="w-full"
            data-testid="button-resend-otp"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend in {resendCooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Code
              </>
            )}
          </Button>

          {/* Help Text */}
          <p className="text-xs text-center text-gray-500">
            Didn't receive the code? Check your spam folder or click "Resend Code"
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
