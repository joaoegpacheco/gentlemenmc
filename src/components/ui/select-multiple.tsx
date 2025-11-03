"use client"

import * as React from "react"
import { useObservable, useValue } from "@legendapp/state/react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronDown } from "lucide-react"

interface SelectMultipleProps {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function SelectMultiple({ options, value, onChange, placeholder = "Selecione..." }: SelectMultipleProps) {
  const open$ = useObservable(false);
  const open = useValue(open$);

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const selectedLabels = options.filter(opt => value.includes(opt.value)).map(opt => opt.label)

  return (
    <Popover open={open} onOpenChange={open$.set}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedLabels.length > 0 
              ? `${selectedLabels.length} selecionado(s)` 
              : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-[300px] overflow-auto p-2">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 p-2 hover:bg-accent rounded"
            >
              <Checkbox
                checked={value.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
              />
              <label className="flex-1 cursor-pointer" onClick={() => handleToggle(option.value)}>
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

