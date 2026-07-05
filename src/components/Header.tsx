import type { Session } from '../types'

export default function Header({
  session,
  onRefresh,
  onLogout,
  refreshing,
  fetchedAt,
}: {
  session: Session
  onRefresh: () => void
  onLogout: () => void
  refreshing: boolean
  fetchedAt?: string
}) {
  const isAdmin = session.role === 'admin'
  const time = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <span className="text-lg">{isAdmin ? '🛡️' : '📋'}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-slate-800">
            {isAdmin ? 'Dashboard Admin' : session.division}
          </p>
          <p className="truncate text-[11px] text-slate-400">
            IFESTOPSIUM #7{time ? ` · diperbarui ${time}` : ''}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          title="Muat ulang data"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-90 disabled:opacity-50"
        >
          <span className={refreshing ? 'inline-block animate-spin' : ''}>↻</span>
        </button>
        <button
          onClick={onLogout}
          title="Keluar"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-600 active:scale-90"
        >
          ⎋
        </button>
      </div>
    </header>
  )
}
