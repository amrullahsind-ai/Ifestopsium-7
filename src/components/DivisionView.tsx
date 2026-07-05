import { useMemo, useState } from 'react'
import type { Division, Status, Task } from '../types'
import { STATUS_ORDER } from '../config'
import { countStatuses, overdueCount, progressPercent } from '../utils/progress'
import { statusStyle } from '../utils/status'
import ProgressRing from './ProgressRing'
import TaskCard from './TaskCard'
import TaskModal, { type TaskDraft } from './TaskModal'

type Filter = Status | 'all'

export default function DivisionView({
  division,
  editable,
  onSave,
  onAdd,
  onDelete,
}: {
  division: Division
  editable: boolean
  onSave: (draft: TaskDraft) => Promise<void>
  onAdd: (draft: TaskDraft) => Promise<void>
  onDelete: (task: Task) => Promise<void>
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<{ mode: 'edit' | 'add'; task: Task | null } | null>(null)
  const [saving, setSaving] = useState(false)

  const counts = useMemo(() => countStatuses(division.tasks), [division.tasks])
  const percent = useMemo(() => progressPercent(division.tasks), [division.tasks])
  const overdue = useMemo(() => overdueCount(division.tasks), [division.tasks])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return division.tasks.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false
      if (q && !`${t.jobdesc} ${t.subtask} ${t.pic} ${t.catatan}`.toLowerCase().includes(q))
        return false
      return true
    })
  }, [division.tasks, filter, query])

  async function handleSave(draft: TaskDraft) {
    setSaving(true)
    try {
      if (modal?.mode === 'add') await onAdd(draft)
      else await onSave(draft)
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!modal?.task) return
    setSaving(true)
    try {
      await onDelete(modal.task)
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-4">
      {/* Ringkasan divisi */}
      <div className="card mb-4 flex items-center gap-4 p-4">
        <ProgressRing percent={percent} size={72} label="progres" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Tugas</p>
          <p className="text-2xl font-extrabold text-slate-800">{division.tasks.length}</p>
          {overdue > 0 && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              ⏰ {overdue} tugas lewat deadline
            </p>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')} label={`Semua (${division.tasks.length})`} />
        {STATUS_ORDER.map((s) => {
          const st = statusStyle(s as Status)
          return (
            <Chip
              key={s}
              active={filter === s}
              onClick={() => setFilter(s as Status)}
              label={`${st.emoji} ${s} (${counts[s as Status]})`}
            />
          )
        })}
      </div>

      {/* Search */}
      <input
        className="input mb-4"
        placeholder="🔍 Cari tugas, PIC, atau catatan…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">Tidak ada tugas yang cocok.</div>
        ) : (
          filtered.map((t) => (
            <TaskCard
              key={t.row}
              task={t}
              editable={editable}
              onClick={() => setModal({ mode: 'edit', task: t })}
            />
          ))
        )}
      </div>

      {/* FAB tambah */}
      {editable && (
        <button
          onClick={() => setModal({ mode: 'add', task: null })}
          className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 active:scale-90"
          title="Tambah tugas"
        >
          +
        </button>
      )}

      {modal && (
        <TaskModal
          mode={modal.mode}
          task={modal.task}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === 'edit' ? handleDelete : undefined}
        />
      )}
    </div>
  )
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}
