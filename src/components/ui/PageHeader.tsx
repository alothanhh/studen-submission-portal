import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PageHeaderProps {
  icon: ReactNode
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export default function PageHeader({ icon, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-accent-500 text-white shadow-md shadow-brand-200">
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  )
}
