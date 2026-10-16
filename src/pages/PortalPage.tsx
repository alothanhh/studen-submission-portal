import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { ClassRow, ClassUsageRow, StudentRow, SubmissionFileRow, SubmissionRow } from '../types'
import { useToast } from '../components/ui/toastContext'
import type { FileAction } from '../components/portal/SubmissionList'
import PortalTopBar from '../components/portal/PortalTopBar'
import ClassPanel from '../components/portal/ClassPanel'
import StatTiles from '../components/portal/StatTiles'
import SubmissionList from '../components/portal/SubmissionList'
import RosterProgress from '../components/portal/RosterProgress'

export default function PortalPage() {
  useDocumentTitle('Portal giáo viên')
  const navigate = useNavigate()
  const { session } = useSession()
  const { showToast } = useToast()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('all')
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [usage, setUsage] = useState<ClassUsageRow[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [pendingFileAction, setPendingFileAction] = useState<string | null>(null)

  const loadClasses = useCallback(async () => {
    const { data, error } = await supabase.from('classes').select('*').order('name', { ascending: true })
    if (error) {
      showToast(`Không tải được danh sách lớp: ${error.message}`, 'danger')
      return
    }
    setClasses(data ?? [])
  }, [showToast])

  const loadSubmissions = useCallback(
    async (classId: string) => {
      setLoadingSubmissions(true)
      let query = supabase
        .from('submissions')
        .select('*, submission_files(*)')
        .order('submitted_at', { ascending: false })
        .order('position', { referencedTable: 'submission_files' })
      if (classId !== 'all') {
        query = query.eq('class_id', classId)
      }
      const rosterQuery =
        classId === 'all'
          ? Promise.resolve({ data: [], error: null })
          : supabase.from('students').select('*').eq('class_id', classId).order('roll_number', { ascending: true })
      // Usage is refreshed with every list load so the numbers stay in step with what's shown.
      const usageQuery = supabase.from('class_storage_usage').select('*')
      const [{ data, error }, roster, usageResult] = await Promise.all([query, rosterQuery, usageQuery])
      setLoadingSubmissions(false)
      setStudents(roster.error ? [] : (roster.data ?? []))
      setUsage(usageResult.error ? [] : (usageResult.data ?? []))
      if (error) {
        showToast(`Không tải được danh sách bài nộp: ${error.message}`, 'danger')
        return
      }
      setSubmissions(data ?? [])
    },
    [showToast],
  )

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  useEffect(() => {
    loadSubmissions(selectedClassId)
  }, [selectedClassId, loadSubmissions])

  async function handleOpenFile(file: SubmissionFileRow, action: FileAction) {
    // Open the preview tab synchronously, inside the click, so popup blockers (Safari) allow it.
    const previewWindow = action === 'preview' ? window.open('', '_blank') : null
    if (previewWindow) previewWindow.opener = null

    setPendingFileAction(`${file.id}:${action}`)
    const { data, error } = await supabase.storage
      .from('submissions')
      .createSignedUrl(file.file_path, 60, action === 'download' ? { download: file.file_name } : undefined)
    setPendingFileAction(null)

    if (error || !data) {
      previewWindow?.close()
      showToast(`Không tạo được liên kết mở file: ${error?.message ?? 'unknown error'}`, 'danger')
      return
    }
    if (previewWindow) {
      previewWindow.location.href = data.signedUrl
    } else {
      // The download URL is served as an attachment, so the portal page stays where it is.
      window.location.assign(data.signedUrl)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/portal/login')
  }

  return (
    <div className="min-h-screen">
      <PortalTopBar email={session?.user.email} onLogout={handleLogout} />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start lg:py-8">
        <aside className="lg:sticky lg:top-24">
          <ClassPanel
            classes={classes}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            usage={usage}
          />
        </aside>

        <section className="flex min-w-0 flex-col gap-6" aria-label="Bài đã nộp">
          <StatTiles
            submissionCount={submissions.length}
            classCount={classes.length}
            storageBytes={
              selectedClassId === 'all'
                ? usage.reduce((sum, row) => sum + row.total_bytes, 0)
                : (usage.find((row) => row.class_id === selectedClassId)?.total_bytes ?? 0)
            }
            filtered={selectedClassId !== 'all'}
            loading={loadingSubmissions}
          />
          {selectedClassId !== 'all' && students.length > 0 && !loadingSubmissions && (
            <RosterProgress
              className={classes.find((c) => c.id === selectedClassId)?.name ?? ''}
              students={students}
              submittedStudentIds={new Set(submissions.flatMap((s) => (s.student_id ? [s.student_id] : [])))}
            />
          )}
          <SubmissionList
            submissions={submissions}
            classes={classes}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            loading={loadingSubmissions}
            pendingFileAction={pendingFileAction}
            onOpenFile={handleOpenFile}
          />
        </section>
      </main>
    </div>
  )
}
