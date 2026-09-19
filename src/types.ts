export interface ClassRow {
  id: string
  name: string
  created_by: string | null
  created_at: string
}

export interface SubmissionRow {
  id: string
  class_id: string
  student_name: string
  student_email: string | null
  file_path: string
  file_name: string
  file_size: number | null
  submitted_at: string
}
