import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowLeftIcon, GraduationCapIcon } from './ui/icons'
import SchoolEyebrow from './ui/SchoolEyebrow'

const footerLinkClass =
  'inline-flex min-h-10 items-center gap-1.5 rounded-control px-2 font-medium text-brand-600 transition hover:text-brand-700'

export default function PublicLayout() {
  const { pathname } = useLocation()
  const onLoginPage = pathname === '/portal/login'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center px-4 py-4 sm:px-6">
        <Link to="/" className="inline-flex min-h-10 min-w-0 items-center gap-3 rounded-control">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-accent-500 text-white shadow-sm shadow-brand-200">
            <GraduationCapIcon className="h-5 w-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <SchoolEyebrow />
            <span className="text-sm leading-5 font-semibold text-slate-800">Cổng nộp bài</span>
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-6">
        <Outlet />
      </main>

      {/* Teachers reach the login page directly at /portal/login; students never see a link to it. */}
      {onLoginPage && (
        <footer className="flex justify-center px-4 pb-6 text-sm">
          <Link to="/" className={footerLinkClass}>
            <ArrowLeftIcon className="h-4 w-4" />
            Quay lại trang nộp bài
          </Link>
        </footer>
      )}
    </div>
  )
}
