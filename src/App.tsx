import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { DashboardData, Division, Session, Task } from './types'
import { addTask, deleteTask, fetchAll, fetchDivision, updateTask } from './api'
import { clearSession, loadPassword, loadSession, saveSession } from './auth'
import Login from './components/Login'
import Header from './components/Header'
import DivisionView from './components/DivisionView'
import AdminDashboard from './components/AdminDashboard'
import type { TaskDraft } from './components/TaskModal'

type Toast = { id: number; text: string; kind: 'ok' | 'err' }

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const load = useCallback(
    async (silent = false) => {
      if (!session) return
      silent ? setRefreshing(true) : setLoading(true)
      setError('')
      try {
        if (session.role === 'admin') {
          setData(await fetchAll())
        } else {
          const div = await fetchDivision(session.division)
          setData({ divisions: [div], fetchedAt: new Date().toISOString() })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [session],
  )

  useEffect(() => {
    if (session) load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  function handleLogin(s: Session, password: string) {
    saveSession(s, password)
    setSession(s)
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    setData(null)
    setSelected(null)
  }

  // Muat ulang satu divisi setelah operasi tulis
  const refreshDivision = useCallback(async (name: string) => {
    const fresh = await fetchDivision(name)
    setData((prev) => {
      if (!prev) return prev
      const exists = prev.divisions.some((d) => d.name === name)
      const divisions = exists
        ? prev.divisions.map((d) => (d.name === name ? fresh : d))
        : [...prev.divisions, fresh]
      return { ...prev, divisions, fetchedAt: new Date().toISOString() }
    })
  }, [])

  // Divisi yang sedang aktif untuk operasi tulis
  const activeDivisionName = session?.role === 'admin' ? selected : session?.division

  const makeHandlers = (divisionName: string) => {
    const pwd = loadPassword()
    return {
      onSave: async (draft: TaskDraft) => {
        try {
          await updateTask(divisionName, pwd, {
            row: draft.row!,
            status: draft.status,
            catatan: draft.catatan,
            link: draft.link,
            pic: draft.pic,
          })
          await refreshDivision(divisionName)
          toast('Tugas berhasil diperbarui')
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Gagal menyimpan', 'err')
          throw e
        }
      },
      onAdd: async (draft: TaskDraft) => {
        try {
          await addTask(divisionName, pwd, draft)
          await refreshDivision(divisionName)
          toast('Tugas baru ditambahkan')
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Gagal menambah', 'err')
          throw e
        }
      },
      onDelete: async (task: Task) => {
        try {
          await deleteTask(divisionName, pwd, task.row)
          await refreshDivision(divisionName)
          toast('Tugas dihapus')
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Gagal menghapus', 'err')
          throw e
        }
      },
    }
  }

  if (!session) return <Login onLogin={handleLogin} />

  const currentDivision: Division | undefined =
    session.role === 'admin'
      ? data?.divisions.find((d) => d.name === selected)
      : data?.divisions[0]

  return (
    <div className="min-h-screen">
      <Header
        session={session}
        onRefresh={() => load(true)}
        onLogout={handleLogout}
        refreshing={refreshing}
        fetchedAt={data?.fetchedAt}
      />

      {/* Breadcrumb admin saat drill-down */}
      {session.role === 'admin' && selected && (
        <div className="mx-auto max-w-5xl px-4 pt-3">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
          >
            ‹ Kembali ke dashboard
          </button>
          <h2 className="mt-1 text-lg font-extrabold text-slate-800">{selected}</h2>
        </div>
      )}

      {loading && !data && <CenterMsg>Memuat data…</CenterMsg>}

      {error && (
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <div className="card border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Gagal memuat</p>
            <p className="mt-1">{error}</p>
            <button className="btn-ghost mt-3" onClick={() => load(false)}>
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {data && !error && (
        <>
          {session.role === 'admin' && !selected && (
            <AdminDashboard data={data} onOpenDivision={setSelected} />
          )}

          {currentDivision && activeDivisionName && (
            <DivisionView
              division={currentDivision}
              editable
              {...makeHandlers(activeDivisionName)}
            />
          )}

          {session.role === 'admin' && selected && !currentDivision && !loading && (
            <CenterMsg>Divisi tidak ditemukan.</CenterMsg>
          )}
        </>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-in rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg ${
              t.kind === 'ok' ? 'bg-slate-800' : 'bg-red-600'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}

function CenterMsg({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      <p className="text-sm">{children}</p>
    </div>
  )
}
