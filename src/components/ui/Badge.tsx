import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'brand' | 'warning'

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  warning: 'bg-warning-50 text-warning-700 ring-warning-200',
}

interface BadgeProps extends ComponentProps<'span'> {
  size?: 'sm' | 'md'
  tone?: Tone
}

export default function Badge({ size = 'md', tone = 'brand', className, children, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-1 rounded-full text-xs font-medium ring-1',
        tones[tone],
        size === 'sm' ? 'px-2.5 py-0.5' : 'px-3 py-1',
        className,
      )}
    >
      {children}
    </span>
  )
}
