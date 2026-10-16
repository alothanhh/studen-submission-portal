// Keep in sync with the bucket's allowed_mime_types and create_submission() in supabase/schema.sql.
export const MIME_BY_EXTENSION: Record<string, string> = {
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.pdf': 'application/pdf',
}

export const ACCEPTED_EXTENSIONS = Object.keys(MIME_BY_EXTENSION)

export const ACCEPTED_ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',')

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB, per file

// Keep in sync with create_submission() in supabase/schema.sql.
export const MAX_FILES_PER_SUBMISSION = 6

// Supabase Free plan storage quota; change if the project is upgraded.
export const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024

export function isAcceptedFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

// Derived from the extension: browsers often report an empty or generic type for Office files,
// which the bucket's MIME allow-list would reject.
export function getMimeType(fileName: string): string | undefined {
  const lowerName = fileName.toLowerCase()
  const ext = ACCEPTED_EXTENSIONS.find((e) => lowerName.endsWith(e))
  return ext ? MIME_BY_EXTENSION[ext] : undefined
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export type FileKind = 'word' | 'excel' | 'powerpoint' | 'pdf'

export const FILE_KIND_LABEL: Record<FileKind, string> = {
  word: 'Word',
  excel: 'Excel',
  powerpoint: 'PowerPoint',
  pdf: 'PDF',
}

export function getFileKind(fileName: string): FileKind | null {
  const lowerName = fileName.toLowerCase()
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return 'word'
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return 'excel'
  if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) return 'powerpoint'
  if (lowerName.endsWith('.pdf')) return 'pdf'
  return null
}
