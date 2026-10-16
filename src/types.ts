export interface ClassRow {
  id: string
  name: string
  created_by: string | null
  created_at: string
}

export interface StudentRow {
  id: string
  class_id: string
  roll_number: number
  full_name: string
}

export interface SubmissionFileRow {
  id: string
  submission_id: string
  file_path: string
  file_name: string
  file_size: number | null
  position: number
  created_at: string
}

export interface SubmissionRow {
  id: string
  class_id: string
  student_id: string | null
  student_name: string
  student_email: string | null
  submitted_at: string
  submission_files: SubmissionFileRow[]
}

export interface ClassUsageRow {
  class_id: string
  name: string
  submission_count: number
  file_count: number
  total_bytes: number
}
