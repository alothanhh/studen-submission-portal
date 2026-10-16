import type { ClassUsageRow } from '../../types'
import { STORAGE_QUOTA_BYTES, formatFileSize } from '../../lib/fileRules'
import { cn } from '../../lib/cn'

export default function StorageUsage({ usage }: { usage: ClassUsageRow[] }) {
  const totalBytes = usage.reduce((sum, row) => sum + row.total_bytes, 0)
  const percent = Math.min(100, (totalBytes / STORAGE_QUOTA_BYTES) * 100)
  const rows = [...usage].sort((a, b) => b.total_bytes - a.total_bytes)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Dung lượng đã dùng</h3>
        <p className="text-xs text-slate-500">
          <span className="font-semibold tabular-nums text-slate-900">{formatFileSize(totalBytes)}</span> /{' '}
          {formatFileSize(STORAGE_QUOTA_BYTES)}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label={`Đã dùng ${formatFileSize(totalBytes)} trên ${formatFileSize(STORAGE_QUOTA_BYTES)}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            percent >= 90 ? 'bg-danger-600' : percent >= 70 ? 'bg-warning-700' : 'bg-linear-to-r from-brand-500 to-accent-500',
          )}
          style={{ width: `${Math.max(percent, totalBytes > 0 ? 1 : 0)}%` }}
        />
      </div>
      {percent >= 70 && (
        <p className="text-xs font-medium text-warning-700">Sắp đầy bộ nhớ. Nên tải file về sao lưu và dọn bớt.</p>
      )}

      {rows.length > 0 && (
        <ul className="flex flex-col divide-y divide-slate-100 text-sm">
          {rows.map((row) => (
            <li key={row.class_id} className="flex items-center justify-between gap-3 py-1.5">
              <span className="min-w-0 truncate font-medium text-slate-700">{row.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-slate-500">
                {formatFileSize(row.total_bytes)} · {row.submission_count} bài
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
