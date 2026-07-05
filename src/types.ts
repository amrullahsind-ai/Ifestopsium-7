// Status resmi sesuai PANDUAN STATUS di spreadsheet
export type Status =
  | 'Selesai'
  | 'Sedang Berjalan'
  | 'Tertunda'
  | 'Belum Dimulai'

export interface Task {
  /** Nomor baris asli di sheet — dipakai sebagai id untuk update/hapus */
  row: number
  no: string
  jobdesc: string
  waktu: string
  subtask: string
  status: Status
  link: string
  pic: string
  catatan: string
}

export interface Division {
  name: string
  tasks: Task[]
}

export interface DashboardData {
  divisions: Division[]
  /** ISO string kapan data diambil dari server */
  fetchedAt: string
}

export type Role = 'admin' | 'panitia'

export interface Session {
  role: Role
  /** Nama divisi untuk panitia; 'ALL' untuk admin */
  division: string
  loggedInAt: string
}

export interface LoginResult {
  ok: boolean
  role?: Role
  division?: string
  message?: string
}
