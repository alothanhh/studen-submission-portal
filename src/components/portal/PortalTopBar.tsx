import Button from '../ui/Button'
import { GraduationCapIcon, LogOutIcon } from '../ui/icons'
import SchoolEyebrow from '../ui/SchoolEyebrow'

interface PortalTopBarProps {
  email?: string
  onLogout: () => void
}

export default function PortalTopBar({ email, onLogout }: PortalTopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-accent-500 text-white shadow-md shadow-brand-200">
            <GraduationCapIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <SchoolEyebrow />
            <h1 className="text-base leading-5 font-bold text-slate-900">Portal giáo viên</h1>
            {email && (
              <p className="truncate text-xs leading-4 text-slate-500" title={email}>
                {email}
              </p>
            )}
          </div>
        </div>
        <Button variant="secondary" icon={<LogOutIcon className="h-4 w-4" />} onClick={onLogout}>
          Đăng xuất
        </Button>
      </div>
    </header>
  )
}
