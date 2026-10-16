import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import {
  controlClass,
  controlToneClass,
  errorTextClass,
  fieldLabelClass,
  fileControlClass,
  hintClass,
} from './fieldStyles'

interface TextFieldProps extends ComponentProps<'input'> {
  label: string
  hideLabel?: boolean
  hint?: string
  error?: string
  // Rendered inside the input on the right, e.g. a show-password toggle.
  endAdornment?: ReactNode
}

// `className` styles the wrapper; all other props go to the <input>.
export default function TextField({
  label,
  hideLabel,
  hint,
  error,
  endAdornment,
  id,
  className,
  type = 'text',
  ...rest
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className={cn(fieldLabelClass, hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative flex flex-col">
        <input
          {...rest}
          id={inputId}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={
            type === 'file'
              ? fileControlClass
              : cn(
                  controlClass,
                  'py-2.5',
                  error ? controlToneClass.invalid : controlToneClass.default,
                  endAdornment != null && 'pr-11',
                )
          }
        />
        {endAdornment && <div className="absolute inset-y-0 right-0 flex items-center">{endAdornment}</div>}
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
