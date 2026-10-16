import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import Card from '../components/ui/Card'
import { ArrowLeftIcon, SearchIcon } from '../components/ui/icons'

export default function NotFoundPage() {
  useDocumentTitle('Không tìm thấy trang')

  return (
    <Card padding="lg" className="flex w-full max-w-md flex-col items-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
        <SearchIcon className="h-7 w-7" />
      </span>
      <p className="mt-5 text-sm font-semibold text-brand-600">Lỗi 404</p>
      <h1 className="mt-1 text-xl font-bold text-slate-900">Không tìm thấy trang</h1>
      <p className="mt-2 text-sm text-slate-500">Đường dẫn bạn mở không tồn tại hoặc đã bị thay đổi.</p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-control bg-linear-to-r from-brand-600 to-accent-600 px-4 text-sm font-semibold text-white shadow-md shadow-brand-200 transition hover:from-brand-700 hover:to-accent-600 active:scale-[0.98]"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Về trang nộp bài
      </Link>
    </Card>
  )
}
