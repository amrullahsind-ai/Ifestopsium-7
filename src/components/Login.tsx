import { useState, type FormEvent } from 'react'
import { login as apiLogin } from '../api'
import type { Session } from '../types'
import { getApiUrl, setApiUrl } from '../config'

const DIVISIONS = [
  'Sie Acara',
  'Sie Humas',
  'Sie PDD',
  'Sie Sponsorship',
  'Sekretaris Pelaksana',
  'Bendahara',
]

export default function Login({
  onLogin,
}: {
  onLogin: (session: Session, password: string) => void
}) {
  const [needUrl, setNeedUrl] = useState(!getApiUrl())
  const [url, setUrl] = useState(getApiUrl())
  const [mode, setMode] = useState<'panitia' | 'admin'>('panitia')
  const [division, setDivision] = useState(DIVISIONS[0])
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function saveUrl() {
    if (!url.trim().includes('script.google.com')) {
      setError('URL harus berupa link Web App dari Google Apps Script (…script.google.com…/exec).')
      return
    }
    setApiUrl(url)
    setError('')
    setNeedUrl(false)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const div = mode === 'admin' ? 'ADMIN' : division
      const res = await apiLogin(div, password)
      if (!res.ok) {
        setError(res.message || 'Password salah. Coba lagi.')
        return
      }
      const session: Session = {
        role: res.role || (mode === 'admin' ? 'admin' : 'panitia'),
        division: res.division || (mode === 'admin' ? 'ALL' : division),
        loggedInAt: new Date().toISOString(),
      }
      onLogin(session, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-800 px-4 py-8">
      <div className="w-full max-w-md animate-scale-in">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/25">
            <span className="text-3xl">📋</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">IFESTOPSIUM #7</h1>
          <p className="text-sm text-white/70">Monitoring Timeline Panitia</p>
        </div>

        <div className="card p-6">
          {needUrl ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Sambungkan ke Spreadsheet</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tempel URL Web App dari Google Apps Script (lihat panduan SETUP.md). Cukup sekali.
                </p>
              </div>
              <div>
                <label className="label">URL Web App</label>
                <input
                  className="input"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              <button className="btn-primary w-full" onClick={saveUrl}>
                Simpan & Lanjut
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode('panitia')}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${
                    mode === 'panitia' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  👥 Panitia
                </button>
                <button
                  type="button"
                  onClick={() => setMode('admin')}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${
                    mode === 'admin' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  🛡️ Admin
                </button>
              </div>

              {mode === 'panitia' && (
                <div>
                  <label className="label">Divisi</label>
                  <select
                    className="input"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">{mode === 'admin' ? 'Password Admin' : 'Password Divisi'}</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <button className="btn-primary w-full" disabled={loading || !password}>
                {loading ? 'Memeriksa…' : 'Masuk'}
              </button>

              <button
                type="button"
                onClick={() => setNeedUrl(true)}
                className="w-full text-center text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                Ganti URL server
              </button>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-white/50">IFESTOPSIUM #7 · IFoP</p>
      </div>
    </div>
  )
}
