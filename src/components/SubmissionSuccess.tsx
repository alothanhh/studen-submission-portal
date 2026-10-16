import { useEffect, useRef, type ReactNode } from 'react'
import Button from './ui/Button'
import { CheckIcon } from './ui/icons'

export interface SubmissionSummary {
  className: string
  studentName: string
  fileNames: string[]
  submittedAt: Date
}

interface SubmissionSuccessProps {
  summary: SubmissionSummary
  onSubmitAnother: () => void
}

export default function SubmissionSuccess({ summary, onSubmitAnother }: SubmissionSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: 'Lớp', value: summary.className },
    { label: 'Họ và tên', value: summary.studentName },
    {
      label: `File (${summary.fileNames.length})`,
      value: (
        <ul className="flex flex-col gap-0.5">
          {summary.fileNames.map((name) => (
            <li key={name} className="break-words">
              {name}
            </li>
          ))}
        </ul>
      ),
    },
    { label: 'Thời gian nộp', value: summary.submittedAt.toLocaleString('vi-VN') },
  ]

  return (
    <div role="status" className="flex flex-col items-center text-center">
      <span className="flex h-14 w-14 animate-pop-in items-center justify-center rounded-full bg-success-500 text-white shadow-lg shadow-success-200">
        <CheckIcon className="h-7 w-7" strokeWidth={2.5} />
      </span>
      <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-lg font-bold text-slate-900 outline-hidden">
        Nộp bài thành công!
      </h2>
      <p className="mt-1 text-sm text-slate-500">Cảm ơn bạn. Bài làm đã được gửi tới giáo viên.</p>

      <dl className="mt-5 w-full divide-y divide-slate-100 rounded-control border border-slate-200 bg-white text-left text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-4 px-4 py-2.5">
            <dt className="w-28 shrink-0 text-slate-500">{row.label}</dt>
            <dd className="min-w-0 flex-1 break-words font-medium text-slate-800">{row.value}</dd>
          </div>
        ))}
      </dl>

      <Button className="mt-5 w-full" onClick={onSubmitAnother}>
        Nộp bài khác
      </Button>
    </div>
  )
}
