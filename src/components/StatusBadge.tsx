import type { Status } from '../types'
import { statusStyle } from '../utils/status'

export default function StatusBadge({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' }) {
  const s = statusStyle(status)
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${pad} ${s.badge}`}>
      <span aria-hidden>{s.emoji}</span>
      {s.label}
    </span>
  )
}
