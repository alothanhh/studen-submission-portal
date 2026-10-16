import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { AlertIcon, CheckIcon, InfoIcon, XIcon } from './icons'
import { ToastContext, type ToastTone } from './toastContext'

interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

const TOAST_DURATION_MS = 4000

const tones: Record<ToastTone, { box: string; icon: string; Icon: typeof CheckIcon }> = {
  success: { box: 'border-success-200', icon: 'bg-success-50 text-success-700', Icon: CheckIcon },
  danger: { box: 'border-danger-200', icon: 'bg-danger-50 text-danger-700', Icon: AlertIcon },
  info: { box: 'border-brand-100', icon: 'bg-brand-50 text-brand-700', Icon: InfoIcon },
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    setToasts((prev) => [...prev, { id: nextId++, tone, message }])
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  )
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const { box, icon, Icon } = tones[toast.tone]

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      role={toast.tone === 'danger' ? 'alert' : undefined}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border bg-white p-3 text-sm text-slate-700 shadow-lg shadow-slate-200/70',
        box,
      )}
    >
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', icon)}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 py-1 break-words">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Đóng thông báo"
        className="-my-1.5 -mr-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
