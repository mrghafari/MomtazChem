import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Eye, FileText, Image as ImageIcon } from "lucide-react";

interface SimpleReceiptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptUrl: string;
  mimeType?: string;
  fileName?: string;
}

export function SimpleReceiptViewer({
  open,
  onOpenChange,
  receiptUrl,
  mimeType = "",
  fileName = "فیش بانکی"
}: SimpleReceiptViewerProps) {
  
  // Simple file type detection
  const getFileType = (url: string, mime: string): 'pdf' | 'image' | 'unknown' => {
    if (mime?.includes('pdf') || url?.toLowerCase().includes('.pdf')) return 'pdf';
    if (mime?.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return 'image';
    return 'unknown';
  };

  const fileType = getFileType(receiptUrl, mimeType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" dir="rtl">
        {/* Simple Header */}
        <DialogHeader className="p-4 border-b bg-green-50 dark:bg-green-900/20">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <FileText className="w-5 h-5" />
              <span>مشاهده فیش بانکی</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(receiptUrl, '_blank')}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Eye className="w-4 h-4 ml-2" />
                باز کردن در صفحه جدید
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Simple Content */}
        <div className="p-4 max-h-[75vh] overflow-auto">
          {fileType === 'pdf' ? (
            <div className="w-full h-[70vh] bg-white rounded-lg border shadow-sm">
              <iframe
                src={receiptUrl}
                className="w-full h-full rounded-lg"
                title="فیش بانکی PDF"
                style={{ border: 'none' }}
              />
            </div>
          ) : fileType === 'image' ? (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
              <img
                src={receiptUrl}
                alt="فیش بانکی"
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const parent = target.parentNode as HTMLElement;
                  parent.innerHTML = `
                    <div class="p-8 text-center text-gray-500">
                      <div class="text-4xl mb-2">⚠️</div>
                      <p>خطا در نمایش تصویر</p>
                    </div>
                  `;
                }}
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">فیش بانکی</p>
              <p className="text-sm text-gray-500 mb-4">
                نوع فایل: {fileName.split('.').pop()?.toUpperCase() || 'نامشخص'}
              </p>
              <Button
                onClick={() => window.open(receiptUrl, '_blank')}
                variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Eye className="w-4 h-4 ml-2" />
                مشاهده فیش
              </Button>
            </div>
          )}
        </div>

        {/* Simple Footer with Close Button */}
        <div className="flex justify-center p-4 border-t bg-gray-50 dark:bg-gray-800">
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-32"
            size="lg"
          >
            <X className="w-4 h-4 ml-2" />
            بستن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}