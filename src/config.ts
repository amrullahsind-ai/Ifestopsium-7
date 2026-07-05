// URL Web App Google Apps Script.
// Prioritas: nilai yang diisi user di layar (localStorage) > variabel .env
const LS_KEY = 'ifestopsium.apiUrl'

export function getApiUrl(): string {
  const fromStorage = localStorage.getItem(LS_KEY)
  if (fromStorage && fromStorage.trim()) return fromStorage.trim()
  const fromEnv = import.meta.env.VITE_API_URL
  if (fromEnv && fromEnv.trim()) return fromEnv.trim()
  return ''
}

export function setApiUrl(url: string): void {
  localStorage.setItem(LS_KEY, url.trim())
}

export function clearApiUrl(): void {
  localStorage.removeItem(LS_KEY)
}

export const STATUS_ORDER = [
  'Selesai',
  'Sedang Berjalan',
  'Tertunda',
  'Belum Dimulai',
] as const
