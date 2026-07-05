import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardData, Status } from '../types'
import { STATUS_ORDER } from '../config'
import { divisionStats, progressPercent, statusColor } from '../utils/progress'
import { statusStyle } from '../utils/status'
import ProgressRing from './ProgressRing'

export default function AdminDashboard({
  data,
  onOpenDivision,
}: {
  data: DashboardData
  onOpenDivision: (name: string) => void
}) {
  const allTasks = useMemo(() => data.divisions.flatMap((d) => d.tasks), [data.divisions])
  const stats = useMemo(
    () => data.divisions.map((d) => divisionStats(d)).sort((a, b) => b.percent - a.percent),
    [data.divisions],
  )
  const overall = useMemo(() => progressPercent(allTasks), [allTasks])
  const totalOverdue = useMemo(() => stats.reduce((s, d) => s + d.overdue, 0), [stats])

  const statusData = useMemo(
    () =>
      STATUS_ORDER.map((s) => ({
        name: s as Status,
        value: allTasks.filter((t) => t.status === s).length,
        color: statusColor(s as Status),
      })).filter((d) => d.value > 0),
    [allTasks],
  )

  const barData = useMemo(
    () => stats.map((s) => ({ name: s.name.replace('Sie ', '').replace('Pelaksana', ''), percent: Math.round(s.percent) })),
    [stats],
  )

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-4">
      {/* KPI ringkas */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Tugas" value={allTasks.length} icon="📦" />
        <KpiCard
          label="Selesai"
          value={allTasks.filter((t) => t.status === 'Selesai').length}
          icon="✅"
          tone="emerald"
        />
        <KpiCard
          label="Berjalan"
          value={allTasks.filter((t) => t.status === 'Sedang Berjalan').length}
          icon="🔄"
          tone="sky"
        />
        <KpiCard label="Lewat Deadline" value={totalOverdue} icon="⏰" tone={totalOverdue ? 'red' : 'slate'} />
      </div>

      {/* Progres keseluruhan + pie */}
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="card flex items-center gap-5 p-5">
          <ProgressRing percent={overall} size={96} stroke={9} label="total" />
          <div>
            <p className="text-sm font-semibold text-slate-500">Progres Keseluruhan</p>
            <p className="text-3xl font-extrabold text-slate-800">{Math.round(overall)}%</p>
            <p className="mt-1 text-xs text-slate-400">{data.divisions.length} divisi dipantau</p>
          </div>
        </div>

        <div className="card p-5">
          <p className="mb-2 text-sm font-semibold text-slate-500">Distribusi Status</p>
          <div className="flex items-center gap-3">
            <div className="h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" innerRadius={38} outerRadius={64} paddingAngle={2}>
                    {statusData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {STATUS_ORDER.map((s) => {
                const st = statusStyle(s as Status)
                const n = allTasks.filter((t) => t.status === s).length
                return (
                  <div key={s} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
                      {s}
                    </span>
                    <span className="font-bold text-slate-700">{n}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart progres per divisi */}
      <div className="card mb-4 p-5">
        <p className="mb-3 text-sm font-semibold text-slate-500">Progres per Divisi (%)</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                {barData.map((d) => (
                  <Cell
                    key={d.name}
                    fill={d.percent >= 80 ? '#10b981' : d.percent >= 40 ? '#0ea5e9' : d.percent > 0 ? '#f59e0b' : '#cbd5e1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Kartu divisi (klik untuk detail) */}
      <p className="mb-2 px-1 text-sm font-bold text-slate-600">Detail per Divisi</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map((s) => (
          <button
            key={s.name}
            onClick={() => onOpenDivision(s.name)}
            className="card flex items-center gap-4 p-4 text-left transition hover:shadow-md hover:ring-brand-200 active:scale-[0.99]"
          >
            <ProgressRing percent={s.percent} size={58} stroke={6} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">{s.name}</p>
              <p className="text-xs text-slate-400">
                {s.counts.Selesai}/{s.total} selesai
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {STATUS_ORDER.map((st) => {
                  const style = statusStyle(st as Status)
                  const n = s.counts[st as Status]
                  if (!n) return null
                  return (
                    <span
                      key={st}
                      className={`h-2 rounded-full ${style.dot}`}
                      style={{ width: `${Math.max(8, (n / s.total) * 60)}px` }}
                      title={`${st}: ${n}`}
                    />
                  )
                })}
              </div>
              {s.overdue > 0 && (
                <span className="mt-1 inline-block text-[11px] font-semibold text-red-600">
                  ⏰ {s.overdue} lewat deadline
                </span>
              )}
            </div>
            <span className="text-slate-300">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  tone = 'brand',
}: {
  label: string
  value: number
  icon: string
  tone?: 'brand' | 'emerald' | 'sky' | 'red' | 'slate'
}) {
  const tones: Record<string, string> = {
    brand: 'text-brand-600',
    emerald: 'text-emerald-600',
    sky: 'text-sky-600',
    red: 'text-red-600',
    slate: 'text-slate-500',
  }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`mt-1 text-2xl font-extrabold ${tones[tone]}`}>{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  )
}
