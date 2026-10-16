import { useEffect, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { ClassRow, StudentRow } from '../types'
import {
  ACCEPTED_ACCEPT_ATTR,
  MAX_FILES_PER_SUBMISSION,
  MAX_FILE_SIZE_BYTES,
  getMimeType,
  isAcceptedFile,
} from '../lib/fileRules'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import SelectField from '../components/ui/SelectField'
import TextField from '../components/ui/TextField'
import FileDropzone from '../components/FileDropzone'
import SubmissionSuccess, { type SubmissionSummary } from '../components/SubmissionSuccess'
import { UploadIcon } from '../components/ui/icons'

interface FieldErrors {
  classId?: string
  studentName?: string
  files?: string
}

function validateFile(file: File): string | undefined {
  if (!isAcceptedFile(file)) {
    return 'Chỉ chấp nhận file Excel (.xls, .xlsx), Word (.doc, .docx), PowerPoint (.ppt, .pptx) hoặc PDF (.pdf).'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) return 'File vượt quá dung lượng tối đa 25MB.'
  return undefined
}

function isSameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified
}

export default function SubmitPage() {
  useDocumentTitle('Nộp bài tập')
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [classId, setClassId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [roster, setRoster] = useState<StudentRow[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploadedCount, setUploadedCount] = useState(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [summary, setSummary] = useState<SubmissionSummary | null>(null)

  const classRef = useRef<HTMLSelectElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const studentRef = useRef<HTMLSelectElement>(null)
  const rosterRequest = useRef(0)
  const fileRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    supabase
      .from('classes')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setErrorMessage(`Không tải được danh sách lớp: ${error.message}`)
          return
        }
        setClasses(data ?? [])
      })
  }, [])

  async function handleClassChange(nextClassId: string) {
    setClassId(nextClassId)
    setStudentId('')
    setRoster([])
    setFieldErrors((prev) => ({ ...prev, classId: undefined, studentName: undefined }))
    setRosterLoading(true)

    // Ignore responses for a class the student has already switched away from.
    const requestId = ++rosterRequest.current
    const { data, error } = await supabase
      .from('students')
      .select('id, class_id, roll_number, full_name')
      .eq('class_id', nextClassId)
      .order('roll_number', { ascending: true })
    if (requestId !== rosterRequest.current) return

    setRosterLoading(false)
    if (error) {
      setErrorMessage(`Không tải được danh sách học sinh: ${error.message}`)
      return
    }
    setRoster(data ?? [])
  }

  function handleAddFiles(picked: File[]) {
    // Validate on pick; invalid files and files over the limit are rejected so they can't be submitted.
    const next = [...files]
    const problems: string[] = []
    for (const candidate of picked) {
      if (next.some((f) => isSameFile(f, candidate))) continue
      const fileError = validateFile(candidate)
      if (fileError) {
        problems.push(`"${candidate.name}": ${fileError}`)
        continue
      }
      if (next.length >= MAX_FILES_PER_SUBMISSION) {
        problems.push(`Chỉ được nộp tối đa ${MAX_FILES_PER_SUBMISSION} file.`)
        break
      }
      next.push(candidate)
    }
    setFiles(next)
    setFieldErrors((prev) => ({
      ...prev,
      files: problems.length > 1 ? `${problems[0]} (và ${problems.length - 1} lỗi khác)` : problems[0],
    }))
  }

  function handleRemoveFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setFieldErrors((prev) => ({ ...prev, files: undefined }))
  }

  const submitting = status === 'loading'
  const hasRoster = roster.length > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage('')

    const errors: FieldErrors = {
      classId: classId ? undefined : 'Vui lòng chọn lớp.',
      studentName: !classId
        ? undefined
        : hasRoster
          ? studentId
            ? undefined
            : 'Vui lòng chọn tên của bạn.'
          : studentName.trim()
            ? undefined
            : 'Vui lòng nhập họ tên.',
      files: files.length === 0 ? 'Vui lòng chọn ít nhất 1 file bài làm.' : undefined,
    }
    flushSync(() => setFieldErrors(errors))

    if (errors.classId) return classRef.current?.focus()
    if (errors.studentName) return (hasRoster ? studentRef : nameRef).current?.focus()
    if (errors.files) return fileRef.current?.focus()

    setStatus('loading')
    setUploadedCount(0)

    const finalName = hasRoster ? (roster.find((r) => r.id === studentId)?.full_name ?? '') : studentName.trim()

    // The client picks the id: anon users can't read submissions back after insert.
    const submissionId = crypto.randomUUID()
    let completed = 0

    const results = await Promise.all(
      files.map(async (file, index) => {
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${classId}/${submissionId}/${index}_${safeFileName}`
        const { error } = await supabase.storage
          .from('submissions')
          .upload(path, file, { contentType: getMimeType(file.name) })
        completed += 1
        setUploadedCount(completed)
        return { file, path, error }
      }),
    )

    const failed = results.find((r) => r.error)
    if (failed?.error) {
      setStatus('error')
      setErrorMessage(`Tải file "${failed.file.name}" lên thất bại: ${failed.error.message}`)
      return
    }

    const { error: insertError } = await supabase.rpc('create_submission', {
      p_id: submissionId,
      p_class_id: classId,
      p_student_name: finalName,
      p_student_id: hasRoster ? studentId : null,
      p_files: results.map((r) => ({ file_path: r.path, file_name: r.file.name })),
    })

    if (insertError) {
      setStatus('error')
      setErrorMessage(`Lưu thông tin nộp bài thất bại: ${insertError.message}`)
      return
    }

    setSummary({
      className: classes.find((c) => c.id === classId)?.name ?? '—',
      studentName: finalName,
      fileNames: files.map((f) => f.name),
      submittedAt: new Date(),
    })
    setStatus('success')
    setStudentName('')
    setStudentId('')
    setRoster([])
    setFiles([])
    setClassId('')
  }


  return (
    <Card padding="lg" className="w-full max-w-md">
      <PageHeader
        icon={<UploadIcon />}
        title="Nộp bài tập"
        subtitle="Chọn lớp và tải lên file bài làm của bạn"
        className="mb-6"
      />

      {status === 'success' && summary ? (
        <SubmissionSuccess summary={summary} onSubmitAnother={() => setStatus('idle')} />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <SelectField
            ref={classRef}
            label="Lớp"
            value={classId}
            onChange={(e) => handleClassChange(e.target.value)}
            error={fieldErrors.classId}
            disabled={submitting}
            required
          >
            <option value="" disabled>
              -- Chọn lớp --
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          {!classId || rosterLoading ? (
            <SelectField label="Họ và tên" value="" disabled>
              <option value="">{rosterLoading ? 'Đang tải danh sách lớp...' : '-- Chọn lớp trước --'}</option>
            </SelectField>
          ) : hasRoster ? (
            <SelectField
              ref={studentRef}
              label="Họ và tên"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value)
                setFieldErrors((prev) => ({ ...prev, studentName: undefined }))
              }}
              hint="Không thấy tên của bạn? Hãy báo giáo viên."
              error={fieldErrors.studentName}
              disabled={submitting}
              required
            >
              <option value="" disabled>
                -- Chọn tên của bạn --
              </option>
              {roster.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roll_number}. {r.full_name}
                </option>
              ))}
            </SelectField>
          ) : (
            <TextField
              ref={nameRef}
              label="Họ và tên"
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value)
                setFieldErrors((prev) => ({ ...prev, studentName: undefined }))
              }}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              error={fieldErrors.studentName}
              disabled={submitting}
              required
            />
          )}

          <FileDropzone
            ref={fileRef}
            label="File bài làm"
            hint={`Tối đa ${MAX_FILES_PER_SUBMISSION} file, mỗi file không quá 25MB. Chấp nhận: .xlsx, .xls, .doc, .docx, .ppt, .pptx, .pdf`}
            accept={ACCEPTED_ACCEPT_ATTR}
            files={files}
            maxFiles={MAX_FILES_PER_SUBMISSION}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            error={fieldErrors.files}
            disabled={submitting}
          />

          {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}

          <Button type="submit" className="mt-1" loading={submitting}>
            {!submitting
              ? 'Nộp bài'
              : uploadedCount < files.length
                ? `Đang tải lên ${uploadedCount}/${files.length} file...`
                : 'Đang lưu bài nộp...'}
          </Button>
        </form>
      )}
    </Card>
  )
}
