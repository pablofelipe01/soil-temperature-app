import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
}

function Card({ children, className = '', hoverable = false }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-gray-200 bg-white shadow-sm
        dark:border-slate-700 dark:bg-slate-800
        ${hoverable ? 'transition-shadow duration-200 hover:shadow-md cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
  action?: ReactNode
}

function CardHeader({ children, className = '', action }: CardHeaderProps) {
  return (
    <div
      className={`
        flex items-center justify-between
        border-b border-gray-200 px-6 py-4
        dark:border-slate-700
        ${className}
      `}
    >
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={`
        border-t border-gray-200 px-6 py-4
        dark:border-slate-700
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardBody, CardFooter }
