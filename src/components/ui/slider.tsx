import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SliderProps {
  className?: string
  value?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onValueChange?: (value: number[]) => void
}

export function Slider({
  className,
  value,
  defaultValue = [0],
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  onValueChange,
}: SliderProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState<number[]>(
    isControlled ? value! : defaultValue,
  )

  const currentValue = isControlled ? value! : internalValue
  const currentVal = currentValue[0] ?? min
  const percentage = Math.min(
    100,
    Math.max(0, ((currentVal - min) / (max - min)) * 100),
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value)
    if (!isControlled) {
      setInternalValue([newVal])
    }
    if (onValueChange) {
      onValueChange([newVal])
    }
  }

  return (
    <div
      className={cn(
        'relative flex w-full touch-none select-none items-center py-1.5',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <div className='relative w-full h-2 bg-slate-200 rounded-full overflow-hidden'>
        <div
          className='absolute h-full bg-slate-900 rounded-full transition-[width] duration-75'
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={currentVal}
        onChange={handleChange}
        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed'
      />
      {/* Visual thumb */}
      <div
        className='absolute -translate-x-1/2 pointer-events-none size-4.5 rounded-full border-2 border-slate-900 bg-white shadow-sm transition-[left] duration-75'
        style={{ left: `${percentage}%` }}
      />
    </div>
  )
}
