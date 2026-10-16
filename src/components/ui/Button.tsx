import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'soft' | 'success'
type Size = 'sm' | 'md' | 'icon'

const variants: Record<Variant, string> = {
  primary:
    'bg-linear-to-r from-brand-600 to-accent-600 text-white shadow-md shadow-brand-200 hover:from-brand-700 hover:to-accent-600',
  secondary: 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  success: 'bg-white text-success-700 shadow-sm ring-1 ring-success-200 hover:bg-success-100',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  icon: 'w-10 text-sm',
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-control font-semibold transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}
