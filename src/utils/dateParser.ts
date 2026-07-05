// Parser tanggal "best-effort" untuk kolom "Waktu Pengerjaan" yang formatnya bebas,
// contoh: "12 Juni", "20-26 Juni", "28 juli-5 agustus", "1–11 juni", "26 September".
// Mengembalikan tanggal AKHIR dari rentang (dipakai untuk deteksi deadline).

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  mei: 4,
  jun: 5,
  jul: 6,
  agu: 7, // agustus / agustu / agt
  agt: 7,
  sep: 8,
  okt: 9,
  nov: 10,
  des: 11,
}

/** Tahun default acara (IFESTOPSIUM #7 berlangsung 2026) */
const DEFAULT_YEAR = 2026

function monthFromWord(word: string): number | null {
  const w = word.toLowerCase().slice(0, 3)
  if (w in MONTHS) return MONTHS[w]
  return null
}

export interface ParsedDeadline {
  end: Date | null
  raw: string
}

export function parseDeadline(raw: string | undefined | null): ParsedDeadline {
  const text = (raw ?? '').toString().trim()
  if (!text) return { end: null, raw: '' }

  // Samakan en-dash / em-dash jadi hyphen, lalu pecah jadi segmen rentang
  const normalized = text.replace(/[‒-―]/g, '-')
  const segments = normalized.split('-').map((s) => s.trim()).filter(Boolean)
  if (segments.length === 0) return { end: null, raw: text }

  const last = segments[segments.length - 1]

  // Cari bulan di segmen terakhir; jika tak ada, cari di segmen sebelumnya
  let month: number | null = null
  const lastMonthMatch = last.match(/[a-zA-Z]+/)
  if (lastMonthMatch) month = monthFromWord(lastMonthMatch[0])
  if (month === null) {
    for (let i = segments.length - 2; i >= 0; i--) {
      const m = segments[i].match(/[a-zA-Z]+/)
      if (m) {
        const parsed = monthFromWord(m[0])
        if (parsed !== null) {
          month = parsed
          break
        }
      }
    }
  }
  if (month === null) return { end: null, raw: text }

  // Ambil angka hari dari segmen terakhir (angka terakhir sebelum bulan)
  const dayMatch = last.match(/\d{1,2}/)
  const day = dayMatch ? parseInt(dayMatch[0], 10) : 1
  if (day < 1 || day > 31) return { end: null, raw: text }

  const end = new Date(DEFAULT_YEAR, month, day, 23, 59, 59)
  return { end, raw: text }
}

export type DeadlineState = 'overdue' | 'today' | 'soon' | 'upcoming' | 'none'

export interface DeadlineInfo {
  state: DeadlineState
  end: Date | null
  daysLeft: number | null
  raw: string
}

/**
 * Tentukan status deadline relatif terhadap hari ini.
 * Tugas yang sudah "Selesai" tidak pernah dianggap overdue.
 */
export function deadlineInfo(raw: string, isDone: boolean, now = new Date()): DeadlineInfo {
  const { end, raw: rawText } = parseDeadline(raw)
  if (!end) return { state: 'none', end: null, daysLeft: null, raw: rawText }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const msPerDay = 24 * 60 * 60 * 1000
  const daysLeft = Math.round((endDay.getTime() - startOfToday.getTime()) / msPerDay)

  if (isDone) return { state: 'none', end, daysLeft, raw: rawText }
  if (daysLeft < 0) return { state: 'overdue', end, daysLeft, raw: rawText }
  if (daysLeft === 0) return { state: 'today', end, daysLeft, raw: rawText }
  if (daysLeft <= 3) return { state: 'soon', end, daysLeft, raw: rawText }
  if (daysLeft <= 7) return { state: 'upcoming', end, daysLeft, raw: rawText }
  return { state: 'none', end, daysLeft, raw: rawText }
}
