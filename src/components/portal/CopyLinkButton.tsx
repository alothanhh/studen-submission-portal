import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import { CheckIcon, LinkIcon } from '../ui/icons'
import { useToast } from '../ui/toastContext'

export default function CopyLinkButton({ className }: { className?: string }) {
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/`)
      setCopied(true)
      showToast('Đã sao chép link nộp bài.', 'success')
    } catch {
      showToast('Không sao chép được link. Vui lòng thử lại.', 'danger')
    }
  }

  return (
    <Button
      variant="secondary"
      className={className}
      icon={copied ? <CheckIcon className="h-4 w-4 text-success-700" /> : <LinkIcon className="h-4 w-4" />}
      onClick={handleCopy}
    >
      {copied ? 'Đã sao chép' : 'Sao chép link nộp bài'}
    </Button>
  )
}
