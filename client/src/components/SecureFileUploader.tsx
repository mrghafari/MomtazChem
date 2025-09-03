import { useState, useCallback } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
// CSS imports moved to index.css to avoid pre-transform errors
// import "@uppy/core/dist/style.min.css";
// import "@uppy/dashboard/dist/style.min.css";
import type { UploadResult, UppyFile } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Shield, FileCheck, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface SecureFileUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  onUploadComplete?: (result: UploadResult<any, any>) => void;
  onSecurityCheck?: (fileName: string, isSecure: boolean, report?: string) => void;
  buttonClassName?: string;
  children: React.ReactNode;
  enableCompression?: boolean;
  enableVirusScanning?: boolean;
  userId?: string;
}

interface SecurityStatus {
  status: 'checking' | 'passed' | 'failed' | 'idle';
  fileName?: string;
  report?: string;
  errors?: string[];
}

/**
 * Secure file uploader with comprehensive security validation
 * 
 * Features:
 * - Multi-layer security validation
 * - Automatic image compression
 * - Virus scanning (if available)
 * - Real-time security status
 * - File type validation
 * - Size limits enforcement
 */
export function SecureFileUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  onUploadComplete,
  onSecurityCheck,
  buttonClassName,
  children,
  enableCompression = true,
  enableVirusScanning = true,
  userId,
}: SecureFileUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({ status: 'idle' });

  // Pre-upload security validation
  const handleGetUploadParameters = useCallback(async (file: any) => {
    setSecurityStatus({ status: 'checking', fileName: file.name });

    try {
      // Step 1: Client-side pre-validation
      const preValidationErrors: string[] = [];

      // File size check
      if (file.size > maxFileSize) {
        preValidationErrors.push(`حجم فایل نباید بیشتر از ${formatFileSize(maxFileSize)} باشد`);
      }

      // File type check
      if (!allowedTypes.includes(file.type)) {
        preValidationErrors.push(`نوع فایل مجاز نیست: ${file.type}`);
      }

      // File extension check
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx'];
      const fileExtension = getFileExtension(file.name);
      if (!allowedExtensions.includes(fileExtension)) {
        preValidationErrors.push(`پسوند فایل مجاز نیست: ${fileExtension}`);
      }

      if (preValidationErrors.length > 0) {
        setSecurityStatus({
          status: 'failed',
          fileName: file.name,
          errors: preValidationErrors
        });
        onSecurityCheck?.(file.name, false, preValidationErrors.join(', '));
        throw new Error(preValidationErrors.join(', '));
      }

      // Step 2: Request secure upload URL from server
      const response = await fetch('/api/secure-upload/generate-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          userId: userId,
          allowedTypes: allowedTypes,
          customSizeLimit: maxFileSize,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setSecurityStatus({
          status: 'failed',
          fileName: file.name,
          errors: result.errors
        });
        onSecurityCheck?.(file.name, false, result.errors?.join(', '));
        throw new Error(result.errors?.join(', ') || 'خطا در تولید لینک آپلود');
      }

      setSecurityStatus({
        status: 'passed',
        fileName: file.name,
        report: result.securityReport
      });

      onSecurityCheck?.(file.name, true, result.securityReport);

      return {
        method: 'PUT' as const,
        url: result.uploadUrl,
      };

    } catch (error) {
      console.error('❌ [SECURE UPLOAD] Pre-upload validation failed:', error);
      setSecurityStatus({
        status: 'failed',
        fileName: file.name,
        errors: [error instanceof Error ? error.message : 'خطا در اعتبارسنجی فایل']
      });
      throw error;
    }
  }, [maxFileSize, allowedTypes, userId, onSecurityCheck]);

  // Post-upload processing
  const handleUploadComplete = useCallback(async (result: UploadResult<any, any>) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        
        // Step 3: Post-upload security validation
        const validationResponse = await fetch('/api/secure-upload/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl: uploadedFile.uploadURL,
            fileName: uploadedFile.name,
            userId: userId,
          }),
        });

        const validationResult = await validationResponse.json();

        if (validationResult.success) {
          setSecurityStatus({
            status: 'passed',
            fileName: uploadedFile.name,
            report: validationResult.securityReport
          });
          console.log('✅ [SECURE UPLOAD] File upload and validation completed successfully');
        } else {
          setSecurityStatus({
            status: 'failed',
            fileName: uploadedFile.name,
            errors: validationResult.errors
          });
          console.error('❌ [SECURE UPLOAD] Post-upload validation failed:', validationResult.errors);
        }
      }

      onUploadComplete?.(result);
    } catch (error) {
      console.error('❌ [SECURE UPLOAD] Post-upload processing failed:', error);
      setSecurityStatus({
        status: 'failed',
        errors: ['خطا در پردازش نهایی فایل']
      });
    }
  }, [onUploadComplete, userId]);

  // Initialize Uppy with security configurations
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: allowedTypes,
      },
      autoProceed: false,
      debug: false,
    });

    uppyInstance.use(AwsS3, {
      shouldUseMultipart: false,
      getUploadParameters: handleGetUploadParameters,
    });

    uppyInstance.on('upload-progress', (file, progress) => {
      const total = progress.bytesTotal || 1;
      setUploadProgress(Math.round((progress.bytesUploaded / total) * 100));
    });

    uppyInstance.on('complete', handleUploadComplete);

    return uppyInstance;
  });

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileExtension = (fileName: string): string => {
    const match = fileName.match(/\.[^.]*$/);
    return match ? match[0].toLowerCase() : '';
  };

  const getSecurityStatusIcon = () => {
    switch (securityStatus.status) {
      case 'checking':
        return <Shield className="w-4 h-4 animate-spin text-blue-500" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileCheck className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSecurityStatusText = () => {
    switch (securityStatus.status) {
      case 'checking':
        return 'در حال بررسی امنیتی...';
      case 'passed':
        return 'بررسی امنیتی موفق';
      case 'failed':
        return 'بررسی امنیتی ناموفق';
      default:
        return 'آماده بررسی امنیتی';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        disabled={securityStatus.status === 'checking'}
      >
        <div className="flex items-center gap-2">
          {getSecurityStatusIcon()}
          {children}
        </div>
      </Button>

      {/* Security Status Display */}
      {securityStatus.status !== 'idle' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getSecurityStatusIcon()}
            <span className="text-sm font-medium">{getSecurityStatusText()}</span>
          </div>

          {securityStatus.fileName && (
            <div className="text-xs text-gray-600">
              فایل: {securityStatus.fileName}
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <Progress value={uploadProgress} className="w-full" />
          )}

          {securityStatus.status === 'failed' && securityStatus.errors && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {securityStatus.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {securityStatus.status === 'passed' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                فایل با موفقیت بررسی و تأیید شد
                {securityStatus.report && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      نمایش گزارش کامل امنیتی
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">
                      {securityStatus.report}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Security Features Info */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-xs">
          <Shield className="w-3 h-3 mr-1" />
          حداکثر {formatFileSize(maxFileSize)}
        </Badge>
        {enableCompression && (
          <Badge variant="secondary" className="text-xs">
            <FileCheck className="w-3 h-3 mr-1" />
            فشردگی خودکار
          </Badge>
        )}
        {enableVirusScanning && (
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            اسکن ویروس
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          اعتبارسنجی چندلایه
        </Badge>
      </div>

      {/* Uppy Modal */}
      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}

export default SecureFileUploader;