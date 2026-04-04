"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * GenericInput — reusable input component with CVA variants.
 * Adapts to store branding via CSS variables.
 */
const inputVariants = cva(
  [
    "flex w-full",
    "rounded-[var(--radius,0.5rem)]",
    "border border-[var(--border,#e2e8f0)]",
    "bg-white text-[var(--foreground,#0f172a)]",
    "placeholder:text-[var(--muted-foreground,#64748b)]",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-[var(--primary,#6366f1)] focus-visible:ring-offset-1",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
  ],
  {
    variants: {
      inputSize: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 py-1 text-xs",
        lg: "h-12 px-5 py-3 text-base",
      },
      state: {
        default: "",
        error: "border-red-500 focus-visible:ring-red-500",
        success: "border-green-500 focus-visible:ring-green-500",
      },
    },
    defaultVariants: {
      inputSize: "default",
      state: "default",
    },
  }
);

export interface GenericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Label displayed above the input */
  label?: string;
  /** Helper text or error message below the input */
  helperText?: string;
  /** Left icon/element */
  startIcon?: React.ReactNode;
  /** Right icon/element */
  endIcon?: React.ReactNode;
}

const GenericInput = React.forwardRef<HTMLInputElement, GenericInputProps>(
  (
    {
      className,
      type = "text",
      inputSize,
      state,
      label,
      helperText,
      startIcon,
      endIcon,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--foreground,#0f172a)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-[var(--muted-foreground,#64748b)]">
              {startIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ inputSize, state, className }),
              startIcon && "ps-10",
              endIcon && "pe-10"
            )}
            ref={ref}
            {...props}
          />
          {endIcon && (
            <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-[var(--muted-foreground,#64748b)]">
              {endIcon}
            </div>
          )}
        </div>
        {helperText && (
          <p
            className={cn(
              "text-xs",
              state === "error"
                ? "text-red-500"
                : state === "success"
                ? "text-green-500"
                : "text-[var(--muted-foreground,#64748b)]"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
GenericInput.displayName = "GenericInput";

export { GenericInput, inputVariants };
