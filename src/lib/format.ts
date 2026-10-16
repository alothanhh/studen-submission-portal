const relativeTimeFormat = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })

const relativeUnits: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

// "5 phút trước", "hôm qua", ...
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diffSeconds = (new Date(iso).getTime() - now) / 1000
  for (const [unit, seconds] of relativeUnits) {
    if (Math.abs(diffSeconds) >= seconds) return relativeTimeFormat.format(Math.round(diffSeconds / seconds), unit)
  }
  return 'vừa xong'
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN')
}

// Lowercase and strip Vietnamese diacritics so "nguyen" matches "Nguyễn". "đ" does not decompose under NFD.
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}
