/**
 * Textarea primitive
 * - Textarea estilizada con tokens de proyecto y estilos de foco.
 * - Forwardea todos los props nativos; mantiene `aria-*` y manejo de `disabled`.
 * - Para inputs largos que requieren ayuda al usuario, considere añadir
 *   un contador de caracteres o `aria-describedby` para mensajes de error.
 */

import { cn } from "@/lib/utils"
import * as React from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"

export { Textarea }
