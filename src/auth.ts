import type { Session } from './types'

const SESSION_KEY = 'ifestopsium.session'
const PWD_KEY = 'ifestopsium.pwd'

export function saveSession(session: Session, password: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  // Password disimpan lokal supaya operasi tulis (update/tambah/hapus) tidak perlu login ulang.
  // Ini sesi perangkat pribadi panitia — bukan penyimpanan rahasia tingkat tinggi.
  sessionStorage.setItem(PWD_KEY, password)
  localStorage.setItem(PWD_KEY, password)
}

export function loadSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function loadPassword(): string {
  return sessionStorage.getItem(PWD_KEY) || localStorage.getItem(PWD_KEY) || ''
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(PWD_KEY)
  localStorage.removeItem(PWD_KEY)
}
