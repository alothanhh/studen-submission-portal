import { SCHOOL_NAME } from '../../lib/school'
import { cn } from '../../lib/cn'

export default function SchoolEyebrow({ className }: { className?: string }) {
  return (
    <p className={cn('truncate text-[11px] leading-4 font-semibold tracking-[0.12em] text-brand-700 uppercase', className)}>
      {SCHOOL_NAME}
    </p>
  )
}
