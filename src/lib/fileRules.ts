export const ACCEPTED_EXTENSIONS = ['.xls', '.xlsx', '.doc', '.docx', '.ppt', '.pptx']

export const ACCEPTED_ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',')

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

export function isAcceptedFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
