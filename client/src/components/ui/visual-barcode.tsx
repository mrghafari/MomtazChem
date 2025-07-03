import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: format,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          margin: 5,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [value, width, height, format, displayValue, fontSize]);

  if (!value) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        No barcode available
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <svg ref={canvasRef}></svg>
    </div>
  );
};

export default VisualBarcode;