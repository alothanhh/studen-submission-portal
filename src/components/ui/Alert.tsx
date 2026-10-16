import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'danger' | 'success' | 'info' | 'neutral'

const roles: Record<Tone, 'alert' | 'status' | undefined> = {
  danger: 'alert',
  success: 'status',
  info: 'status',
  neutral: undefined,
}

const tones: Record<Tone, string> = {
  danger: 'border-danger-200 bg-danger-50 text-danger-700',
  success: 'border-success-200 bg-success-50 text-success-800',
  info: 'border-brand-100 bg-brand-50 text-brand-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-500',
}

interface AlertProps extends ComponentProps<'div'> {
  tone?: Tone
}

export default function Alert({ tone = 'info', className, children, ...rest }: AlertProps) {
  return (
    <div
      role={roles[tone]}
      {...rest}
      className={cn('rounded-control border px-3.5 py-2.5 text-sm', tones[tone], className)}
    >
      {children}
    </div>
  )
}
