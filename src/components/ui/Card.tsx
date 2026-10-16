import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends ComponentProps<'div'> {
  padding?: 'md' | 'lg'
}

export default function Card({ padding = 'md', className, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        'animate-fade-in rounded-card border border-slate-100 bg-white/90 shadow-card backdrop-blur',
        padding === 'lg' ? 'p-8' : 'p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
