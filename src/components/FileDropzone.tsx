import { useEffect, useId, useRef, useState, type DragEvent, type Ref } from 'react'
import { cn } from '../lib/cn'
import { FILE_KIND_LABEL, formatFileSize, getFileKind, type FileKind } from '../lib/fileRules'
import { errorTextClass, fieldLabelClass } from './ui/fieldStyles'
import { FileExcelIcon, FilePdfIcon, FilePptIcon, FileWordIcon, UploadIcon, XIcon } from './ui/icons'

const kindIcon: Record<FileKind, typeof FileWordIcon> = {
  word: FileWordIcon,
  excel: FileExcelIcon,
  powerpoint: FilePptIcon,
  pdf: FilePdfIcon,
}

const kindTone: Record<FileKind, string> = {
  word: 'bg-sky-50 text-sky-700 ring-sky-100',
  excel: 'bg-success-50 text-success-700 ring-success-100',
  powerpoint: 'bg-warning-50 text-warning-700 ring-warning-200',
  pdf: 'bg-danger-50 text-danger-700 ring-danger-100',
}

interface FileDropzoneProps {
  label: string
  hint: string
  accept: string
  files: File[]
  maxFiles: number
  onAddFiles: (files: File[]) => void
  onRemoveFile: (index: number) => void
  error?: string
  disabled?: boolean
  // Points at the dropzone button so the parent can focus it on validation errors.
  ref?: Ref<HTMLButtonElement>
}

export default function FileDropzone({
  label,
  hint,
  accept,
  files,
  maxFiles,
  onAddFiles,
  onRemoveFile,
  error,
  disabled,
  ref,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLButtonElement | null>(null)
  const refocusAfterRemove = useRef(false)
  const [dragActive, setDragActive] = useState(false)
  const id = useId()
  const labelId = `${id}-label`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const full = files.length >= maxFiles

  useEffect(() => {
    if (refocusAfterRemove.current) {
      refocusAfterRemove.current = false
      dropzoneRef.current?.focus()
    }
  }, [files])

  function setDropzoneRef(node: HTMLButtonElement | null) {
    dropzoneRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    if (!disabled) setDragActive(true)
  }

  function handleDragLeave(e: DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragActive(false)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragActive(false)
    if (disabled) return
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length > 0) onAddFiles(dropped)
  }

  function handleRemove(index: number) {
    refocusAfterRemove.current = true
    onRemoveFile(index)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span id={labelId} className={fieldLabelClass}>
          {label}
        </span>
        <span className={cn('text-xs tabular-nums', full ? 'font-medium text-brand-700' : 'text-slate-500')}>
          {files.length}/{maxFiles} file
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? [])
          if (picked.length > 0) onAddFiles(picked)
          // Reset so picking the same file again still fires onChange.
          e.target.value = ''
        }}
      />

      {files.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="File đã chọn">
          {files.map((file, index) => {
            const kind = getFileKind(file.name)
            const KindIcon = kind ? kindIcon[kind] : FileWordIcon
            return (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex animate-fade-in items-center gap-3 rounded-control border border-slate-200 bg-white p-2.5"
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
                    kind ? kindTone[kind] : 'bg-slate-50 text-slate-500 ring-slate-100',
                  )}
                >
                  <KindIcon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {kind ? FILE_KIND_LABEL[kind] : 'File'} · {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  aria-label={`Gỡ file ${file.name}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {!full && (
        <button
          ref={setDropzoneRef}
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-labelledby={`${labelId} ${id}-prompt`}
          aria-describedby={[hintId, error && errorId].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          className={cn(
            'flex items-center rounded-control border-2 border-dashed transition disabled:cursor-not-allowed disabled:opacity-60',
            files.length > 0 ? 'justify-center gap-2 px-4 py-3' : 'flex-col gap-2 px-4 py-6 text-center',
            dragActive
              ? 'border-brand-500 bg-brand-50'
              : error
                ? 'border-danger-200 bg-danger-50/50 hover:border-danger-600'
                : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50',
          )}
        >
          <span
            className={cn(
              'flex items-center justify-center rounded-full transition',
              files.length > 0 ? 'h-7 w-7' : 'h-10 w-10',
              dragActive ? 'bg-brand-600 text-white' : 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200',
            )}
          >
            <UploadIcon className={files.length > 0 ? 'h-4 w-4' : 'h-5 w-5'} />
          </span>
          <span id={`${id}-prompt`} className="text-sm text-slate-600">
            {dragActive ? (
              <span className="font-semibold text-brand-700">Thả file vào đây</span>
            ) : files.length > 0 ? (
              <span className="font-semibold text-brand-600">Thêm file</span>
            ) : (
              <>
                Kéo thả file vào đây hoặc <span className="font-semibold text-brand-600">chọn file</span>
              </>
            )}
          </span>
        </button>
      )}

      <p id={hintId} className="text-xs text-slate-500">
        {hint}
      </p>
      {error && (
        <p id={errorId} role="alert" className={errorTextClass}>
          {error}
        </p>
      )}
    </div>
  )
}
