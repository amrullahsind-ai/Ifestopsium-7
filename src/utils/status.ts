import type { Status } from '../types'

/** Normalisasi teks status apa pun (termasuk kosong / typo) ke salah satu Status resmi */
export function normalizeStatus(raw: string | undefined | null): Status {
  const s = (raw ?? '').toString().trim().toLowerCase()
  if (!s) return 'Belum Dimulai'
  if (s.includes('selesai') || s.includes('done') || s.includes('✓')) return 'Selesai'
  if (s.includes('jalan') || s.includes('progress') || s.includes('proses') || s.includes('⟳'))
    return 'Sedang Berjalan'
  if (s.includes('tunda') || s.includes('pending') || s.includes('delay') || s.includes('!'))
    return 'Tertunda'
  return 'Belum Dimulai'
}

interface StatusStyle {
  label: Status
  emoji: string
  /** kelas Tailwind untuk badge */
  badge: string
  /** warna untuk chart / bar */
  color: string
  dot: string
}

const STYLES: Record<Status, StatusStyle> = {
  Selesai: {
    label: 'Selesai',
    emoji: '✓',
    badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    color: '#10b981',
    dot: 'bg-emerald-500',
  },
  'Sedang Berjalan': {
    label: 'Sedang Berjalan',
    emoji: '⟳',
    badge: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
    color: '#0ea5e9',
    dot: 'bg-sky-500',
  },
  Tertunda: {
    label: 'Tertunda',
    emoji: '!',
    badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    color: '#f59e0b',
    dot: 'bg-amber-500',
  },
  'Belum Dimulai': {
    label: 'Belum Dimulai',
    emoji: '○',
    badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    color: '#94a3b8',
    dot: 'bg-slate-400',
  },
}

export function statusStyle(status: Status): StatusStyle {
  return STYLES[status]
}

/** Bobot progres per status untuk hitung persentase penyelesaian */
export function statusWeight(status: Status): number {
  switch (status) {
    case 'Selesai':
      return 1
    case 'Sedang Berjalan':
      return 0.5
    case 'Tertunda':
      return 0.25
    default:
      return 0
  }
}
