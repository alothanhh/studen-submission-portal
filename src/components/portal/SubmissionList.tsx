import { useMemo, useState, type ReactNode } from 'react'
import type { ClassRow, SubmissionFileRow, SubmissionRow } from '../../types'
import { formatFileSize, getFileKind, type FileKind } from '../../lib/fileRules'
import { formatDateTime, formatRelativeTime, normalizeForSearch } from '../../lib/format'
import { cn } from '../../lib/cn'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import SelectField from '../ui/SelectField'
import Skeleton from '../ui/Skeleton'
import TextField from '../ui/TextField'
import { AlertIcon, DownloadIcon, EyeIcon, FileExcelIcon, FilePdfIcon, FilePptIcon, FileWordIcon, InboxIcon, SearchIcon } from '../ui/icons'
import CopyLinkButton from './CopyLinkButton'

const SKELETON_ROWS = 5

export type FileAction = 'preview' | 'download'

const kindIcon: Record<FileKind, typeof FileWordIcon> = {
  word: FileWordIcon,
  excel: FileExcelIcon,
  powerpoint: FilePptIcon,
  pdf: FilePdfIcon,
}

const kindColor: Record<FileKind, string> = {
  word: 'text-sky-600',
  excel: 'text-success-700',
  powerpoint: 'text-warning-700',
  pdf: 'text-danger-600',
}

interface SubmissionListProps {
  submissions: SubmissionRow[]
  classes: ClassRow[]
  selectedClassId: string
  onSelectClass: (classId: string) => void
  loading: boolean
  pendingFileAction: string | null
  onOpenFile: (file: SubmissionFileRow, action: FileAction) => void
}

export default function SubmissionList({
  submissions,
  classes,
  selectedClassId,
  onSelectClass,
  loading,
  pendingFileAction,
  onOpenFile,
}: SubmissionListProps) {
  const [search, setSearch] = useState('')

  // Attempt number per student within a class, oldest first. Roster students are matched by id,
  // typed names by their normalized form. Computed before the search filter so numbers stay stable.
  const attemptById = useMemo(() => {
    const counts = new Map<string, number>()
    const attempts = new Map<string, number>()
    const oldestFirst = [...submissions].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
    for (const s of oldestFirst) {
      const key = `${s.class_id}:${s.student_id ?? normalizeForSearch(s.student_name)}`
      const attempt = (counts.get(key) ?? 0) + 1
      counts.set(key, attempt)
      attempts.set(s.id, attempt)
    }
    return attempts
  }, [submissions])

  const visible = useMemo(() => {
    const query = normalizeForSearch(search)
    if (!query) return submissions
    return submissions.filter((s) => normalizeForSearch(s.student_name).includes(query))
  }, [submissions, search])

  function classNameById(id: string) {
    return classes.find((c) => c.id === id)?.name ?? '—'
  }

  function clearFilters() {
    setSearch('')
    onSelectClass('all')
  }

  const hasFilter = selectedClassId !== 'all' || search.trim() !== ''

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Bài đã nộp</h2>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <TextField
            type="search"
            label="Tìm theo tên học sinh"
            hideLabel
            placeholder="Tìm theo tên học sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-60"
            endAdornment={<SearchIcon className="mr-3 h-4 w-4 text-slate-400" />}
          />
          <SelectField
            label="Lớp"
            inline
            value={selectedClassId}
            onChange={(e) => onSelectClass(e.target.value)}
          >
            <option value="all">Tất cả các lớp</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      <p role="status" className="sr-only">
        {loading ? 'Đang tải danh sách bài nộp...' : `${visible.length} bài nộp`}
      </p>
      <div aria-busy={loading}>
        {loading ? (
          <LoadingState />
        ) : visible.length === 0 ? (
          hasFilter ? (
            <EmptyState
              title="Không có bài nộp phù hợp"
              description="Thử đổi lớp hoặc từ khoá tìm kiếm."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Xoá bộ lọc
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Chưa có bài nộp nào"
              description="Gửi link trang nộp bài cho học sinh. Bài nộp mới sẽ xuất hiện tại đây."
              action={<CopyLinkButton />}
            />
          )
        ) : (
          <>
            <SubmissionTable
              submissions={visible}
              attemptById={attemptById}
              classNameById={classNameById}
              pendingFileAction={pendingFileAction}
              onOpenFile={onOpenFile}
            />
            <SubmissionCards
              submissions={visible}
              attemptById={attemptById}
              classNameById={classNameById}
              pendingFileAction={pendingFileAction}
              onOpenFile={onOpenFile}
            />
          </>
        )}
      </div>
    </Card>
  )
}

interface RowsProps {
  submissions: SubmissionRow[]
  attemptById: Map<string, number>
  classNameById: (id: string) => string
  pendingFileAction: string | null
  onOpenFile: (file: SubmissionFileRow, action: FileAction) => void
}

interface FileListProps {
  files: SubmissionFileRow[]
  pendingFileAction: string | null
  onOpenFile: (file: SubmissionFileRow, action: FileAction) => void
}

// One line per file: type icon, name, size, then actions. Only PDFs can be previewed in the
// browser; Office files are download-only.
function FileList({ files, pendingFileAction, onOpenFile }: FileListProps) {
  if (files.length === 0) return <p className="text-xs text-slate-500">Không có file</p>
  return (
    <ul className="flex flex-col gap-1">
      {files.map((file) => {
        const kind = getFileKind(file.file_name)
        const Icon = kind ? kindIcon[kind] : FileWordIcon
        const previewing = pendingFileAction === `${file.id}:preview`
        const downloading = pendingFileAction === `${file.id}:download`
        return (
          <li key={file.id} className="flex min-w-0 items-center gap-2">
            <Icon className={cn('h-4 w-4', kind ? kindColor[kind] : 'text-slate-500')} />
            <span className="min-w-0 flex-1 truncate text-[13px] text-slate-700" title={file.file_name}>
              {file.file_name}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-slate-500">{formatFileSize(file.file_size)}</span>
            {/* Fixed width keeps the size column aligned whether a row has one or two buttons. */}
            <div className="flex w-[84px] shrink-0 justify-end gap-1">
              {kind === 'pdf' && (
                <Button
                  variant="soft"
                  size="icon"
                  loading={previewing}
                  icon={previewing ? undefined : <EyeIcon className="h-4 w-4" />}
                  aria-label={`Xem ${file.file_name}`}
                  title="Xem trước"
                  onClick={() => onOpenFile(file, 'preview')}
                />
              )}
              <Button
                variant={kind === 'pdf' ? 'secondary' : 'soft'}
                size="icon"
                loading={downloading}
                icon={downloading ? undefined : <DownloadIcon className="h-4 w-4" />}
                aria-label={`Tải xuống ${file.file_name}`}
                title="Tải xuống"
                onClick={() => onOpenFile(file, 'download')}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function AttemptBadge({ attempt }: { attempt: number | undefined }) {
  if (!attempt || attempt < 2) return null
  return (
    <Badge size="sm" tone="warning" title={`Học sinh này đã nộp trước đó; đây là lần thứ ${attempt}`}>
      <AlertIcon className="h-3 w-3" />
      Nộp lần {attempt}
    </Badge>
  )
}

function SubmissionTable({ submissions, attemptById, classNameById, pendingFileAction, onOpenFile }: RowsProps) {
  return (
    <div className="hidden max-h-[70vh] overflow-auto rounded-xl ring-1 ring-slate-100 sm:block">
      {/* table-fixed + explicit widths: the auto layout ignores max-width, so long names would never truncate. */}
      <table className="w-full min-w-[46rem] table-fixed text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-4 py-3">Học sinh</th>
            <th scope="col" className="w-24 px-4 py-3">Lớp</th>
            <th scope="col" className="w-96 px-4 py-3">File</th>
            <th scope="col" className="w-32 px-4 py-3">Nộp lúc</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {submissions.map((s) => (
            <tr key={s.id} className="align-top transition hover:bg-brand-50/40">
              <td className="px-4 py-3">
                <p className="truncate font-medium text-slate-800" title={s.student_name}>
                  {s.student_name}
                </p>
                {s.student_email && (
                  <p className="truncate text-xs text-slate-500" title={s.student_email}>
                    {s.student_email}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-500">{s.submission_files.length} file</span>
                  <AttemptBadge attempt={attemptById.get(s.id)} />
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge size="sm" className="max-w-full">
                  <span className="truncate">{classNameById(s.class_id)}</span>
                </Badge>
              </td>
              <td className="px-3 py-2">
                <FileList files={s.submission_files} pendingFileAction={pendingFileAction} onOpenFile={onOpenFile} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                <time dateTime={s.submitted_at} title={formatDateTime(s.submitted_at)}>
                  {formatRelativeTime(s.submitted_at)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SubmissionCards({ submissions, attemptById, classNameById, pendingFileAction, onOpenFile }: RowsProps) {
  return (
    <ul className="flex flex-col gap-3 sm:hidden">
      {submissions.map((s) => (
        <li key={s.id} className="animate-fade-in rounded-xl border border-slate-100 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{s.student_name}</p>
              <time dateTime={s.submitted_at} title={formatDateTime(s.submitted_at)} className="text-xs text-slate-500">
                {formatRelativeTime(s.submitted_at)} · {s.submission_files.length} file
              </time>
              <div className="mt-1 empty:hidden">
                <AttemptBadge attempt={attemptById.get(s.id)} />
              </div>
            </div>
            <Badge size="sm" className="shrink-0">
              {classNameById(s.class_id)}
            </Badge>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
            <FileList files={s.submission_files} pendingFileAction={pendingFileAction} onOpenFile={onOpenFile} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function LoadingState() {
  const rows = Array.from({ length: SKELETON_ROWS }, (_, i) => i)
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl ring-1 ring-slate-100 sm:block">
        <div className="h-10 bg-slate-50" />
        {rows.map((i) => (
          <div key={i} className="flex h-[61px] items-center gap-6 border-t border-slate-100 bg-white px-4">
            <div className="flex w-1/4 flex-col gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-24 rounded-control" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.slice(0, 3).map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-24 rounded-control" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function EmptyState({ title, description, action }: { title: string; description: string; action: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
        <InboxIcon className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      <div className="mt-5">{action}</div>
    </div>
  )
}
