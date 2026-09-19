import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../lib/useSession'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Đang tải...</div>
    )
  if (!session) return <Navigate to="/portal/login" replace />

  return <>{children}</>
}
