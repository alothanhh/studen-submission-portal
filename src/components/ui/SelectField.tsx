import { useId, type ComponentProps } from 'react'
import { cn } from '../../lib/cn'
import { controlClass, controlToneClass, errorTextClass, fieldLabelClass, hintClass } from './fieldStyles'
import { ChevronDownIcon } from './icons'

interface SelectFieldProps extends ComponentProps<'select'> {
  label: string
  hint?: string
  error?: string
  // Label beside the control instead of above it (compact toolbar filters).
  inline?: boolean
}

// `className` styles the wrapper; all other props go to the <select>.
export default function SelectField({ label, hint, error, inline, id, className, children, ...rest }: SelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const hintId = `${selectId}-hint`
  const errorId = `${selectId}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn(inline ? 'flex items-center gap-2' : 'flex flex-col gap-1.5', className)}>
      <label htmlFor={selectId} className={fieldLabelClass}>
        {label}
      </label>
      {/* Native arrow is hidden (appearance-none) so the chevron can sit inside the padding. */}
      <div className={cn('relative flex', inline && 'min-w-0 flex-1')}>
        <select
          {...rest}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            controlClass,
            'peer w-full cursor-pointer appearance-none pr-10',
            inline ? 'py-2 text-sm' : 'py-2.5',
            error ? controlToneClass.invalid : controlToneClass.default,
          )}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500 peer-disabled:opacity-60" />
      </div>
      {hint && (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={errorTextClass}>
          {error}
        </p>
      )}
    </div>
  )
}
