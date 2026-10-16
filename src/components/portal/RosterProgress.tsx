import type { StudentRow } from '../../types'
import Card from '../ui/Card'
import { CheckIcon } from '../ui/icons'

interface RosterProgressProps {
  className: string
  students: StudentRow[]
  submittedStudentIds: Set<string>
}

export default function RosterProgress({ className, students, submittedStudentIds }: RosterProgressProps) {
  const missing = students.filter((s) => !submittedStudentIds.has(s.id))
  const submittedCount = students.length - missing.length
  const percent = Math.round((submittedCount / students.length) * 100)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Tình hình nộp bài lớp {className}</h2>
        <p className="text-sm text-slate-600">
          Đã nộp{' '}
          <span className="font-semibold tabular-nums text-slate-900">
            {submittedCount}/{students.length}
          </span>{' '}
          học sinh
        </p>
      </div>

      <div
        role="progressbar"
        aria-label={`Đã nộp ${submittedCount} trên ${students.length} học sinh`}
        aria-valuemin={0}
        aria-valuemax={students.length}
        aria-valuenow={submittedCount}
        className="h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-brand-500 to-accent-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {missing.length === 0 ? (
        <p className="flex items-center gap-2 text-sm font-medium text-success-700">
          <CheckIcon className="h-4 w-4" />
          Tất cả học sinh đã nộp bài.
        </p>
      ) : (
        <details className="group">
          <summary className="flex min-h-10 cursor-pointer items-center rounded-control text-sm font-medium text-brand-700 hover:text-brand-600">
            Xem {missing.length} học sinh chưa nộp
          </summary>
          <ul className="mt-2 grid gap-x-4 gap-y-1 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-3">
            {missing.map((s) => (
              <li key={s.id} className="truncate">
                <span className="inline-block w-7 tabular-nums text-slate-500">{s.roll_number}.</span>
                {s.full_name}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  )
}
