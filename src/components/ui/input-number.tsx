"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface InputNumberProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: number
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ className, value, onChange, min, max, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (val === '' || val === '-') {
        onChange?.(null)
        return
      }
      const numVal = Number.parseFloat(val)
      if (!Number.isNaN(numVal)) {
        let finalVal = numVal
        if (min !== undefined && finalVal < min) finalVal = min
        if (max !== undefined && finalVal > max) finalVal = max
        onChange?.(finalVal)
      }
    }

    return (
      <Input
        type="number"
        ref={ref}
        value={value ?? ''}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        className={cn(className)}
        {...props}
      />
    )
  }
)
InputNumber.displayName = "InputNumber"

export { InputNumber }

