import type { ClassRow, ClassUsageRow } from '../../types'
import { cn } from '../../lib/cn'
import Card from '../ui/Card'
import CopyLinkButton from './CopyLinkButton'
import StorageUsage from './StorageUsage'

interface ClassPanelProps {
  classes: ClassRow[]
  selectedClassId: string
  onSelectClass: (classId: string) => void
  usage: ClassUsageRow[]
}

export default function ClassPanel({ classes, selectedClassId, onSelectClass, usage }: ClassPanelProps) {
  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Lớp học</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {classes.length > 0 ? 'Chọn lớp để lọc danh sách bài nộp.' : 'Chưa có lớp nào. Lớp được tạo bằng file SQL trong Supabase.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo lớp">
        <ClassChip label="Tất cả" active={selectedClassId === 'all'} onClick={() => onSelectClass('all')} />
        {classes.map((c) => (
          <ClassChip key={c.id} label={c.name} active={selectedClassId === c.id} onClick={() => onSelectClass(c.id)} />
        ))}
      </div>

      <div className="border-t border-slate-100 pt-5">
        <StorageUsage usage={usage} />
      </div>

      <div className="border-t border-slate-100 pt-5">
        <p className="mb-2 text-xs text-slate-500">Gửi link này cho học sinh để nộp bài:</p>
        <CopyLinkButton className="w-full" />
      </div>
    </Card>
  )
}

function ClassChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-h-10 rounded-full px-4 text-sm font-medium ring-1 transition duration-150 active:scale-[0.98]',
        active
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-200 ring-brand-600'
          : 'bg-brand-50 text-brand-700 ring-brand-100 hover:bg-brand-100',
      )}
    >
      {label}
    </button>
  )
}
