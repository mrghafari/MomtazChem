import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

interface VisualBarcodeProps {
  value: string;
  width?: number;
  height?: number;
  format?: string;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

const VisualBarcode = ({
  value,
  width = 2,
  height = 60,
  format = "EAN13",
  displayValue = true,
  fontSize = 12,
  className = ""
}: VisualBarcodeProps) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        // Clear previous content
        canvasRef.current.innerHTML = '';
        setError(null);
        
        // Validate barcode format
        if (value.length !== 13) {
          throw new Error('EAN-13 barcode must be exactly 13 digits');
        }
        
        if (!/^\d+$/.test(value)) {
          throw new Error('Barcode must contain only digits');
        }
        
        JsBarcode(canvasRef.current, value, {
          format: format,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000",
          textMargin: 5,
          valid: function(valid) {
            if (!valid) {
              setError('Invalid barcode format');
            } else {
              setIsGenerated(true);
            }
          }
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
        setError(error instanceof Error ? error.message : 'Failed to generate barcode');
        setIsGenerated(false);
      }
    }
  }, [value, width, height, format, displayValue, fontSize]);

  if (!value) {
    return (
      <div className={`text-gray-400 text-sm p-2 border border-gray-200 rounded ${className}`}>
        بارکد موجود نیست
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm p-2 border border-red-200 rounded bg-red-50 ${className}`}>
        خطا در تولید بارکد: {error}
        <div className="text-xs mt-1">بارکد: {value}</div>
      </div>
    );
  }

  return (
    <div className={`inline-block border border-gray-200 rounded p-2 bg-white ${className}`}>
      <svg ref={canvasRef} className="max-w-full"></svg>
      {!isGenerated && (
        <div className="text-gray-500 text-xs mt-1">در حال تولید بارکد...</div>
      )}
    </div>
  );
};

export default VisualBarcode;