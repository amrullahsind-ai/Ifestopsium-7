import type { Division, Status, Task } from '../types'
import { deadlineInfo } from './dateParser'
import { statusWeight } from './status'

export interface StatusCounts {
  Selesai: number
  'Sedang Berjalan': number
  Tertunda: number
  'Belum Dimulai': number
}

export function countStatuses(tasks: Task[]): StatusCounts {
  const c: StatusCounts = {
    Selesai: 0,
    'Sedang Berjalan': 0,
    Tertunda: 0,
    'Belum Dimulai': 0,
  }
  for (const t of tasks) c[t.status]++
  return c
}

/** Persentase progres 0-100 (Selesai=100%, Berjalan=50%, Tertunda=25%) */
export function progressPercent(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  const total = tasks.reduce((sum, t) => sum + statusWeight(t.status), 0)
  return (total / tasks.length) * 100
}

/** Jumlah tugas yang overdue (lewat deadline & belum selesai) */
export function overdueCount(tasks: Task[], now = new Date()): number {
  return tasks.filter((t) => {
    const info = deadlineInfo(t.waktu, t.status === 'Selesai', now)
    return info.state === 'overdue'
  }).length
}

export function statusColor(status: Status): string {
  return {
    Selesai: '#10b981',
    'Sedang Berjalan': '#0ea5e9',
    Tertunda: '#f59e0b',
    'Belum Dimulai': '#94a3b8',
  }[status]
}

export interface DivisionStats {
  name: string
  total: number
  percent: number
  counts: StatusCounts
  overdue: number
}

export function divisionStats(div: Division, now = new Date()): DivisionStats {
  return {
    name: div.name,
    total: div.tasks.length,
    percent: progressPercent(div.tasks),
    counts: countStatuses(div.tasks),
    overdue: overdueCount(div.tasks, now),
  }
}
