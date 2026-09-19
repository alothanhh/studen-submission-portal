import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ClassRow } from '../types'
import { ACCEPTED_ACCEPT_ATTR, MAX_FILE_SIZE_BYTES, isAcceptedFile } from '../lib/fileRules'

export default function SubmitPage() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [classId, setClassId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage('')

    if (!classId) {
      setErrorMessage('Vui lòng chọn lớp.')
      return
    }
    if (!studentName.trim()) {
      setErrorMessage('Vui lòng nhập họ tên.')
      return
    }
    if (!file) {
      setErrorMessage('Vui lòng chọn file bài làm.')
      return
    }
    if (!isAcceptedFile(file)) {
      setErrorMessage('Chỉ chấp nhận file Excel (.xls, .xlsx), Word (.doc, .docx) hoặc PowerPoint (.ppt, .pptx).')
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File vượt quá dung lượng tối đa 25MB.')
      return
    }

    setStatus('loading')

    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${classId}/${timestamp}_${safeFileName}`

    const { error: uploadError } = await supabase.storage.from('submissions').upload(path, file)

    if (uploadError) {
      setStatus('error')
      setErrorMessage(`Tải file lên thất bại: ${uploadError.message}`)
      return
    }

    const { error: insertError } = await supabase.from('submissions').insert({
      class_id: classId,
      student_name: studentName.trim(),
      file_path: path,
      file_name: file.name,
      file_size: file.size,
    })

    if (insertError) {
      setStatus('error')
      setErrorMessage(`Lưu thông tin nộp bài thất bại: ${insertError.message}`)
      return
    }

    setStatus('success')
    setStudentName('')
    setFile(null)
    setClassId('')
    const fileInput = document.getElementById('file-input') as HTMLInputElement | null
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white/90 p-8 shadow-xl shadow-indigo-100 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-xl text-white shadow-md shadow-indigo-200">
            📤
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Nộp bài tập</h1>
            <p className="text-sm text-slate-500">Chọn lớp và tải lên file bài làm của bạn</p>
          </div>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">✓</span>
              Nộp bài thành công! Cảm ơn bạn.
            </div>
            <button
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-100"
              onClick={() => setStatus('idle')}
            >
              Nộp bài khác
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>Lớp</span>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="" disabled>
                  -- Chọn lớp --
                </option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>Họ và tên</span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>File bài làm</span>
              <input
                id="file-input"
                type="file"
                accept={ACCEPTED_ACCEPT_ATTR}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className="cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 outline-none transition file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <small className="font-normal text-slate-400">Chấp nhận: .xlsx, .xls, .doc, .docx, .ppt, .pptx (tối đa 25MB)</small>
            </label>

            {errorMessage && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                {errorMessage}
              </div>
            )}

            <button
              className="mt-1 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          </form>
        )}
      </div>

      <p className="text-sm text-slate-500">
        <Link to="/portal/login" className="font-medium text-indigo-600 transition hover:text-indigo-700">
          Đăng nhập dành cho giáo viên
        </Link>
      </p>
    </div>
  )
}
