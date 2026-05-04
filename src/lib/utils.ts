// Small utilities used across the app

/**
 * cn(...classes)
 * - Utility helper para combinar clases CSS (Tailwind) condicionalmente.
 * - Acepta strings y valores falsy; filtra falsy y une con espacios.
 * - Uso típico: `className={cn('px-4', condition && 'text-red-500')}`
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
