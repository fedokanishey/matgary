"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ThemePreset {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  foregroundColor: string
  accentColor?: string
}

interface ThemeCardProps {
  theme: ThemePreset
  isSelected?: boolean
  onSelect?: (theme: ThemePreset) => void
  className?: string
}

export function ThemeCard({
  theme,
  isSelected = false,
  onSelect,
  className,
}: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(theme)}
      className={cn(
        "relative group p-4 rounded-xl border-2 transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.02]",
        isSelected
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-offset-2"
          : "border-[var(--border)] hover:border-[var(--primary)]/50",
        className
      )}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-lg">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Mini preview */}
      <div className="space-y-3">
        {/* Header bar */}
        <div
          className="h-3 w-full rounded-full"
          style={{ backgroundColor: theme.primaryColor }}
        />

        {/* Content preview */}
        <div className="space-y-2">
          {/* Title text */}
          <div
            className="h-2 w-3/4 rounded-full"
            style={{ backgroundColor: theme.foregroundColor, opacity: 0.8 }}
          />
          {/* Subtitle text */}
          <div
            className="h-1.5 w-1/2 rounded-full"
            style={{ backgroundColor: theme.foregroundColor, opacity: 0.4 }}
          />
        </div>

        {/* Button preview */}
        <div className="flex gap-2">
          <div
            className="h-5 px-3 rounded-md flex items-center justify-center"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <span className="text-[8px] font-medium text-white">Button</span>
          </div>
          <div
            className="h-5 px-3 rounded-md flex items-center justify-center border"
            style={{ 
              borderColor: theme.secondaryColor,
              color: theme.secondaryColor 
            }}
          >
            <span className="text-[8px] font-medium" style={{ color: theme.secondaryColor }}>
              Secondary
            </span>
          </div>
        </div>

        {/* Accent element */}
        {theme.accentColor && (
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.accentColor }}
            />
            <div
              className="h-1 w-8 rounded-full"
              style={{ backgroundColor: theme.foregroundColor, opacity: 0.3 }}
            />
          </div>
        )}
      </div>

      {/* Theme name */}
      <p
        className="mt-3 text-xs font-medium text-center truncate"
        style={{ color: theme.foregroundColor }}
      >
        {theme.name}
      </p>
    </button>
  )
}

// Preset themes
export const presetThemes: ThemePreset[] = [
  {
    id: "default",
    name: "Indigo Classic",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    backgroundColor: "#ffffff",
    foregroundColor: "#0f172a",
    accentColor: "#f59e0b",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    primaryColor: "#0ea5e9",
    secondaryColor: "#06b6d4",
    backgroundColor: "#f8fafc",
    foregroundColor: "#0c4a6e",
    accentColor: "#14b8a6",
  },
  {
    id: "forest",
    name: "Forest Green",
    primaryColor: "#22c55e",
    secondaryColor: "#10b981",
    backgroundColor: "#f0fdf4",
    foregroundColor: "#14532d",
    accentColor: "#84cc16",
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    primaryColor: "#f97316",
    secondaryColor: "#fb923c",
    backgroundColor: "#fffbeb",
    foregroundColor: "#7c2d12",
    accentColor: "#fbbf24",
  },
  {
    id: "rose",
    name: "Rose Pink",
    primaryColor: "#ec4899",
    secondaryColor: "#f472b6",
    backgroundColor: "#fdf2f8",
    foregroundColor: "#831843",
    accentColor: "#f43f5e",
  },
  {
    id: "midnight",
    name: "Midnight Dark",
    primaryColor: "#818cf8",
    secondaryColor: "#a78bfa",
    backgroundColor: "#0f172a",
    foregroundColor: "#f8fafc",
    accentColor: "#fbbf24",
  },
  {
    id: "slate",
    name: "Slate Modern",
    primaryColor: "#3b82f6",
    secondaryColor: "#60a5fa",
    backgroundColor: "#f1f5f9",
    foregroundColor: "#1e293b",
    accentColor: "#f59e0b",
  },
  {
    id: "crimson",
    name: "Crimson Bold",
    primaryColor: "#dc2626",
    secondaryColor: "#ef4444",
    backgroundColor: "#fef2f2",
    foregroundColor: "#450a0a",
    accentColor: "#fbbf24",
  },
]

export default ThemeCard
