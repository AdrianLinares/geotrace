/**
 * Input primitive
 * - Wraps a native `<input>` with consistent design tokens and focus styles.
 * - All native props (`aria-*`, `type`, `disabled`, etc.) are forwarded.
 * - Accessibility: keep `aria-*` attributes on the input when used inside
 *   custom components (labels must use `htmlFor` when outside).
 * - Extender: to add custom behaviors (e.g., clear button for `type=search`),
 *   prefer composing this primitive rather than mutating it directly.
 */

import { cn } from "@/lib/utils"
import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          type === "search" && "pr-10",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
