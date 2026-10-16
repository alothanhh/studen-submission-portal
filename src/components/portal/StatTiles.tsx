import type { ReactNode } from 'react'
import Skeleton from '../ui/Skeleton'
import { formatFileSize } from '../../lib/fileRules'
import { GraduationCapIcon, HardDriveIcon, InboxIcon } from '../ui/icons'

interface StatTilesProps {
  submissionCount: number
  classCount: number
  storageBytes: number
  filtered: boolean
  loading: boolean
}

export default function StatTiles({
  submissionCount,
  classCount,
  storageBytes,
  filtered,
  loading,
}: StatTilesProps) {
  return (
    <dl className="grid grid-cols-3 gap-3">
      <StatTile
        label="Bài nộp"
        caption={filtered ? 'Lớp đang chọn' : 'Tất cả các lớp'}
        value={submissionCount}
        loading={loading}
        icon={<InboxIcon className="h-4 w-4" />}
      />
      <StatTile
        label="Dung lượng"
        caption={filtered ? 'Lớp đang chọn' : 'Tất cả các lớp'}
        value={formatFileSize(storageBytes)}
        loading={loading}
        icon={<HardDriveIcon className="h-4 w-4" />}
      />
      <StatTile label="Lớp học" caption="Đang quản lý" value={classCount} icon={<GraduationCapIcon className="h-4 w-4" />} />
    </dl>
  )
}

interface StatTileProps {
  label: string
  caption: string
  value: ReactNode
  icon: ReactNode
  loading?: boolean
}

function StatTile({ label, caption, value, icon, loading }: StatTileProps) {
  return (
    <div className="rounded-card border border-slate-100 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-4">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span className="hidden text-brand-600 sm:inline-flex">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1">
        {loading ? (
          <Skeleton className="my-1 h-7 w-10" />
        ) : (
          <span className="text-2xl font-bold tabular-nums text-slate-900">{value}</span>
        )}
        <span className="mt-0.5 block truncate text-xs text-slate-500">{caption}</span>
      </dd>
    </div>
  )
}
