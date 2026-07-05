import type { Task } from '../types'
import { deadlineInfo } from '../utils/dateParser'
import { statusStyle } from '../utils/status'
import StatusBadge from './StatusBadge'
import DeadlineBadge from './DeadlineBadge'

export default function TaskCard({
  task,
  editable,
  onClick,
}: {
  task: Task
  editable: boolean
  onClick: () => void
}) {
  const s = statusStyle(task.status)
  const dl = deadlineInfo(task.waktu, task.status === 'Selesai')

  return (
    <div
      onClick={editable ? onClick : undefined}
      className={`card overflow-hidden p-4 transition ${
        editable ? 'cursor-pointer hover:shadow-md hover:ring-brand-200 active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug text-slate-800">
              {task.no && <span className="mr-1 text-slate-400">{task.no}.</span>}
              {task.jobdesc || '(tanpa nama)'}
            </p>
            {editable && <span className="shrink-0 text-slate-300">✏️</span>}
          </div>

          {task.subtask && (
            <p className="mt-0.5 text-xs italic text-slate-500">{task.subtask}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={task.status} size="sm" />
            {dl.state !== 'none' && <DeadlineBadge info={dl} />}
            {task.waktu && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                🗓️ {task.waktu}
              </span>
            )}
            {task.pic && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                👤 {task.pic}
              </span>
            )}
          </div>

          {task.catatan && (
            <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
              📝 {task.catatan}
            </p>
          )}

          {task.link && (
            <a
              href={task.link.startsWith('http') ? task.link : `https://${task.link}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              🔗 Lihat link progres
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
