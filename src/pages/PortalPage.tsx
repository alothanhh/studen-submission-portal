import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ClassRow, SubmissionRow } from '../types'
import { formatFileSize } from '../lib/fileRules'

export default function PortalPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('all')
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [newClassName, setNewClassName] = useState('')
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadClasses = useCallback(async () => {
    const { data, error } = await supabase.from('classes').select('*').order('name', { ascending: true })
    if (error) {
      setErrorMessage(`Không tải được danh sách lớp: ${error.message}`)
      return
    }
    setClasses(data ?? [])
  }, [])

  const loadSubmissions = useCallback(async (classId: string) => {
    setLoadingSubmissions(true)
    let query = supabase.from('submissions').select('*').order('submitted_at', { ascending: false })
    if (classId !== 'all') {
      query = query.eq('class_id', classId)
    }
    const { data, error } = await query
    setLoadingSubmissions(false)
    if (error) {
      setErrorMessage(`Không tải được danh sách bài nộp: ${error.message}`)
      return
    }
    setSubmissions(data ?? [])
  }, [])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  useEffect(() => {
    loadSubmissions(selectedClassId)
  }, [selectedClassId, loadSubmissions])

  async function handleAddClass(e: FormEvent) {
    e.preventDefault()
    if (!newClassName.trim()) return
    const { error } = await supabase.from('classes').insert({ name: newClassName.trim() })
    if (error) {
      setErrorMessage(`Không tạo được lớp: ${error.message}`)
      return
    }
    setNewClassName('')
    loadClasses()
  }

  async function handleDownload(submission: SubmissionRow) {
    const { data, error } = await supabase.storage
      .from('submissions')
      .createSignedUrl(submission.file_path, 60)
    if (error || !data) {
      setErrorMessage(`Không tạo được liên kết tải xuống: ${error?.message ?? 'unknown error'}`)
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/portal/login')
  }

  function classNameById(id: string) {
    return classes.find((c) => c.id === id)?.name ?? '—'
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-xl text-white shadow-md shadow-indigo-200">
            🎓
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Portal giáo viên</h1>
            <p className="text-sm text-slate-500">Quản lý lớp học và bài nộp của học sinh</p>
          </div>
        </div>
        <button
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          onClick={handleLogout}
        >
          Đăng xuất
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-indigo-100/60 backdrop-blur">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Quản lý lớp</h2>
        <form onSubmit={handleAddClass} className="flex gap-2">
          <input
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="Tên lớp mới, vd: 10A1"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            className="rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-500 hover:to-violet-500"
            type="submit"
          >
            Thêm lớp
          </button>
        </form>

        {classes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {classes.map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100"
              >
                {c.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-indigo-100/60 backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Bài đã nộp</h2>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <span>Lọc theo lớp</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">Tất cả các lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loadingSubmissions ? (
          <p className="py-8 text-center text-sm text-slate-500">Đang tải...</p>
        ) : submissions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Chưa có bài nộp nào.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Học sinh</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Dung lượng</th>
                  <th className="px-4 py-3">Thời gian nộp</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="transition hover:bg-indigo-50/40">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">{s.student_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{s.student_email ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                        {classNameById(s.class_id)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{s.file_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatFileSize(s.file_size)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {new Date(s.submitted_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        onClick={() => handleDownload(s)}
                      >
                        Tải xuống
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
