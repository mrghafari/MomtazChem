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
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleValueChange = (newValue: number[]) => {
    if (newValue.length === 2) {
      const typedValue: [number, number] = [newValue[0], newValue[1]];
      setLocalValue(typedValue);
      // Call the onValueChange callback to update parent component
      onValueChange(typedValue);
    }
  };

  return (
    <div className="w-full">
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center py-3",
          className
        )}
        value={localValue}
        onValueChange={handleValueChange}
        onValueCommit={() => setIsDragging(false)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <SliderPrimitive.Range className="absolute h-full bg-blue-500 dark:bg-blue-400 rounded-full" />
        </SliderPrimitive.Track>
        
        {/* First thumb for minimum value with tooltip */}
        <SliderPrimitive.Thumb 
          className="relative block h-6 w-6 rounded-full border-2 border-blue-500 bg-white dark:bg-gray-950 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg hover:scale-110 transform"
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {localValue[0].toLocaleString()} IQD
          </div>
        </SliderPrimitive.Thumb>
        
        {/* Second thumb for maximum value with tooltip */}
        <SliderPrimitive.Thumb 
          className="relative block h-6 w-6 rounded-full border-2 border-blue-500 bg-white dark:bg-gray-950 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg hover:scale-110 transform"
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {localValue[1].toLocaleString()} IQD
          </div>
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
      
      {/* Display current values below slider */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {localValue[0].toLocaleString()} IQD
        </span>
        <span className="text-gray-400">to</span>
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {localValue[1].toLocaleString()} IQD
        </span>
      </div>
    </div>
  )
})

RangeSlider.displayName = "RangeSlider"

export { RangeSlider }