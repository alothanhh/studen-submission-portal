import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import TextField from '../components/ui/TextField'
import { EyeIcon, EyeOffIcon, InfoIcon, KeyIcon } from '../components/ui/icons'

export default function LoginPage() {
  useDocumentTitle('Đăng nhập giáo viên')
  const { session, loading } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!loading && session) return <Navigate to="/portal" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setSubmitting(false)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    navigate('/portal')
  }

  return (
    <Card padding="lg" className="w-full max-w-md">
      <PageHeader
        icon={<KeyIcon />}
        title="Đăng nhập giáo viên"
        subtitle="Truy cập portal quản lý bài nộp"
        className="mb-6"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="giaovien@truong.edu.vn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
        />
        <TextField
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          required
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={showPassword}
              className="flex h-10 w-10 items-center justify-center rounded-control text-slate-500 transition hover:text-slate-700"
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          }
        />
        {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}
        <Button type="submit" className="mt-1" loading={submitting}>
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      {/* Static note, not a live update: role={undefined} drops the info tone's default role="status". */}
      <Alert tone="info" role={undefined} className="mt-5 flex items-start gap-2.5">
        <InfoIcon className="mt-px h-4 w-4 text-brand-600" />
        <span>
          <span className="font-semibold">Chưa có tài khoản?</span> Liên hệ quản trị viên để được cấp tài khoản giáo viên.
        </span>
      </Alert>
    </Card>
  )
}
