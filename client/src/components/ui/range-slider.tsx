import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface RangeSliderProps {
  value: [number, number]
  onValueChange: (value: [number, number]) => void
  min: number
  max: number
  step?: number
  className?: string
  disabled?: boolean
}

const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(({ className, value, onValueChange, min, max, step = 1, disabled, ...props }, ref) => {
  const [localValue, setLocalValue] = React.useState<[number, number]>(value);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleValueChange = (newValue: number[]) => {
    if (newValue.length === 2) {
      setLocalValue([newValue[0], newValue[1]]);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for debounced update
      timeoutRef.current = setTimeout(() => {
        onValueChange([newValue[0], newValue[1]]);
      }, 150);
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);



  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={localValue}
      onValueChange={handleValueChange}

      min={min}
      max={max}
      step={step}
      disabled={disabled}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {/* First thumb for minimum value */}
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      {/* Second thumb for maximum value */}
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
})

RangeSlider.displayName = "RangeSlider"

export { RangeSlider }