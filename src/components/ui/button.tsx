"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button variants using CVA (Class Variance Authority).
 *
 * Uses CSS variables (--primary, --secondary, etc.) injected by ThemeProvider
 * so the button automatically adapts to any store's branding.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-[var(--radius,0.5rem)]",
    "text-sm font-semibold",
    "transition-all duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--primary,#6366f1)] text-white",
          "hover:bg-[var(--primary,#6366f1)]/90",
          "focus-visible:ring-[var(--primary,#6366f1)]",
          "shadow-sm hover:shadow-md",
        ],
        secondary: [
          "bg-[var(--secondary,#8b5cf6)] text-white",
          "hover:bg-[var(--secondary,#8b5cf6)]/90",
          "focus-visible:ring-[var(--secondary,#8b5cf6)]",
          "shadow-sm",
        ],
        destructive: [
          "bg-red-600 text-white",
          "hover:bg-red-700",
          "focus-visible:ring-red-500",
          "shadow-sm",
        ],
        outline: [
          "border-2 border-[var(--border,#e2e8f0)]",
          "bg-transparent text-[var(--foreground,#0f172a)]",
          "hover:bg-[var(--muted,#f1f5f9)]",
          "focus-visible:ring-[var(--primary,#6366f1)]",
        ],
        ghost: [
          "bg-transparent text-[var(--foreground,#0f172a)]",
          "hover:bg-[var(--muted,#f1f5f9)]",
          "focus-visible:ring-[var(--primary,#6366f1)]",
        ],
        link: [
          "bg-transparent text-[var(--primary,#6366f1)]",
          "underline-offset-4 hover:underline",
          "focus-visible:ring-0 p-0 h-auto",
        ],
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child component (e.g., Link) using Slot pattern */
  asChild?: boolean;
  /** Show loading spinner */
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin size-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
