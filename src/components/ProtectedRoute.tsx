import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../lib/useSession'
import Spinner from './ui/Spinner'
import { GraduationCapIcon } from './ui/icons'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()

  if (loading)
    return (
      <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-accent-500 text-white shadow-md shadow-brand-200">
          <GraduationCapIcon className="h-6 w-6" />
        </span>
        <span className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner className="text-brand-600" />
          Đang tải...
        </span>
      </div>
    )
  if (!session) return <Navigate to="/portal/login" replace />

  return <>{children}</>
}
