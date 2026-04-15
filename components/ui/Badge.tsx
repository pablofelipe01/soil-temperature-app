import { type ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
type TemperatureBadge = 'freezing' | 'cold' | 'cool' | 'warm' | 'hot' | 'extreme'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  temperature?: TemperatureBadge
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

const temperatureStyles: Record<TemperatureBadge, string> = {
  freezing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  cold: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  cool: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  warm: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  hot: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  extreme: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

function Badge({ children, variant = 'default', temperature, className = '' }: BadgeProps) {
  const styles = temperature ? temperatureStyles[temperature] : variantStyles[variant]

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5
        text-xs font-medium
        ${styles}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export { Badge, type BadgeProps, type BadgeVariant, type TemperatureBadge }
