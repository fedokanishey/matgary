"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value?: string
  defaultValue?: string
  onChange?: (color: string) => void
  label?: string
  description?: string
  presetColors?: string[]
  className?: string
}

const defaultPresetColors = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
]

export function ColorPicker({
  value,
  defaultValue = "#6366f1",
  onChange,
  label,
  description,
  presetColors = defaultPresetColors,
  className,
}: ColorPickerProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const currentValue = value !== undefined ? value : internalValue
  const [inputValue, setInputValue] = React.useState(currentValue)

  React.useEffect(() => {
    setInputValue(currentValue)
  }, [currentValue])

  const handleColorChange = (color: string) => {
    const normalizedColor = color.startsWith("#") ? color : `#${color}`
    if (value === undefined) {
      setInternalValue(normalizedColor)
    }
    setInputValue(normalizedColor)
    onChange?.(normalizedColor)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      handleColorChange(newValue)
    }
  }

  const handleInputBlur = () => {
    // Reset to current value if input is invalid
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(currentValue)
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
          {description && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-3">
        {/* Color Input (Native Picker) */}
        <div className="relative">
          <input
            type="color"
            value={currentValue}
            onChange={(e) => handleColorChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="w-12 h-12 rounded-lg border-2 border-[var(--border)] shadow-sm cursor-pointer transition-all hover:scale-105 hover:shadow-md"
            style={{ backgroundColor: currentValue }}
          />
        </div>

        {/* Hex Input */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted-foreground)]">HEX</span>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              maxLength={7}
              className="flex h-10 w-28 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono uppercase placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      {/* Preset Colors */}
      {presetColors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorChange(color)}
              className={cn(
                "w-7 h-7 rounded-md border-2 transition-all hover:scale-110",
                currentValue.toLowerCase() === color.toLowerCase()
                  ? "border-[var(--foreground)] ring-2 ring-[var(--primary)] ring-offset-2"
                  : "border-transparent hover:border-[var(--border)]"
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { ColorPicker as default }
