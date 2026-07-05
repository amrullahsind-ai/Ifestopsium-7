import type { DeadlineInfo } from '../utils/dateParser'

const CFG: Record<
  string,
  { cls: string; text: (d: DeadlineInfo) => string } | undefined
> = {
  overdue: {
    cls: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    text: (d) => `Telat ${Math.abs(d.daysLeft ?? 0)} hari`,
  },
  today: {
    cls: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200 animate-pulse',
    text: () => 'Deadline hari ini',
  },
  soon: {
    cls: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    text: (d) => `${d.daysLeft} hari lagi`,
  },
  upcoming: {
    cls: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
    text: (d) => `${d.daysLeft} hari lagi`,
  },
}

export default function DeadlineBadge({ info }: { info: DeadlineInfo }) {
  const cfg = CFG[info.state]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
      <span aria-hidden>⏰</span>
      {cfg.text(info)}
    </span>
  )
}
