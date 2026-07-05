import { useEffect, useState } from 'react'
import type { Status, Task } from '../types'
import { STATUS_ORDER } from '../config'
import { statusStyle } from '../utils/status'

export type TaskDraft = Omit<Task, 'row'> & { row?: number }

const EMPTY: TaskDraft = {
  no: '',
  jobdesc: '',
  waktu: '',
  subtask: '',
  status: 'Belum Dimulai',
  link: '',
  pic: '',
  catatan: '',
}

export default function TaskModal({
  task,
  mode,
  saving,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null
  mode: 'edit' | 'add'
  saving: boolean
  onClose: () => void
  onSave: (draft: TaskDraft) => void
  onDelete?: () => void
}) {
  const [draft, setDraft] = useState<TaskDraft>(task ?? EMPTY)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setDraft(task ?? EMPTY)
    setConfirmDelete(false)
  }, [task])

  function set<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg animate-fade-in overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === 'add' ? '➕ Tambah Tugas' : '✏️ Edit Tugas'}
          </h2>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Jobdesc / Kegiatan</label>
            <textarea
              className="input min-h-[70px] resize-y"
              placeholder="Nama tugas / kegiatan"
              value={draft.jobdesc}
              onChange={(e) => set('jobdesc', e.target.value)}
              disabled={mode === 'edit'}
            />
            {mode === 'edit' && (
              <p className="mt-1 text-[11px] text-slate-400">
                Nama kegiatan & waktu dikunci saat edit — ubah lewat mode Tambah bila perlu.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Waktu Pengerjaan</label>
              <input
                className="input"
                placeholder="cth: 20-26 Juni"
                value={draft.waktu}
                onChange={(e) => set('waktu', e.target.value)}
                disabled={mode === 'edit'}
              />
            </div>
            <div>
              <label className="label">PIC</label>
              <input
                className="input"
                placeholder="Nama PIC"
                value={draft.pic}
                onChange={(e) => set('pic', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Status Progres</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_ORDER.map((s) => {
                const st = statusStyle(s as Status)
                const active = draft.status === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s as Status)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition ${
                      active
                        ? st.badge + ' ring-2'
                        : 'bg-slate-50 text-slate-500 ring-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{st.emoji}</span>
                    <span className="truncate">{s}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {mode === 'add' && (
            <div>
              <label className="label">Keterangan / Sub-Task</label>
              <input
                className="input"
                placeholder="Opsional"
                value={draft.subtask}
                onChange={(e) => set('subtask', e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="label">Link Progres</label>
            <input
              className="input"
              placeholder="https://… (opsional)"
              value={draft.link}
              onChange={(e) => set('link', e.target.value)}
            />
          </div>

          <div>
            <label className="label">Catatan</label>
            <textarea
              className="input min-h-[60px] resize-y"
              placeholder="Catatan tambahan (opsional)"
              value={draft.catatan}
              onChange={(e) => set('catatan', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {mode === 'edit' && onDelete && (
            <>
              {confirmDelete ? (
                <button className="btn-danger flex-1" onClick={onDelete} disabled={saving}>
                  Yakin hapus?
                </button>
              ) : (
                <button
                  className="btn-danger"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                  title="Hapus tugas"
                >
                  🗑️
                </button>
              )}
            </>
          )}
          <button className="btn-ghost" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            className="btn-primary flex-1"
            onClick={() => onSave(draft)}
            disabled={saving || !draft.jobdesc.trim()}
          >
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
