import { getApiUrl } from './config'
import type { DashboardData, Division, LoginResult, Task } from './types'
import { normalizeStatus } from './utils/status'

/**
 * Semua request ke Apps Script memakai GET (untuk baca) dan POST text/plain (untuk tulis).
 * POST sengaja pakai Content-Type text/plain supaya dianggap "simple request" oleh browser
 * sehingga TIDAK memicu CORS preflight (OPTIONS) yang tidak didukung Apps Script.
 */

class ApiError extends Error {}

function requireUrl(): string {
  const url = getApiUrl()
  if (!url) throw new ApiError('URL server belum diatur.')
  return url
}

async function post<T>(payload: Record<string, unknown>): Promise<T> {
  const url = requireUrl()
  const res = await fetch(url, {
    method: 'POST',
    // text/plain => tidak ada preflight
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  })
  if (!res.ok) throw new ApiError(`Server error (${res.status})`)
  const data = await res.json()
  if (data && data.error) throw new ApiError(data.error)
  return data as T
}

async function get<T>(params: Record<string, string>): Promise<T> {
  const url = requireUrl()
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${url}?${qs}`, { method: 'GET', redirect: 'follow' })
  if (!res.ok) throw new ApiError(`Server error (${res.status})`)
  const data = await res.json()
  if (data && data.error) throw new ApiError(data.error)
  return data as T
}

interface RawTask {
  row: number
  no: string
  jobdesc: string
  waktu: string
  subtask: string
  status: string
  link: string
  pic: string
  catatan: string
}

interface RawDivision {
  name: string
  tasks: RawTask[]
}

function hydrateDivision(d: RawDivision): Division {
  return {
    name: d.name,
    tasks: (d.tasks || []).map((t) => ({
      row: t.row,
      no: String(t.no ?? ''),
      jobdesc: String(t.jobdesc ?? ''),
      waktu: String(t.waktu ?? ''),
      subtask: String(t.subtask ?? ''),
      status: normalizeStatus(t.status),
      link: String(t.link ?? ''),
      pic: String(t.pic ?? ''),
      catatan: String(t.catatan ?? ''),
    })),
  }
}

// ---- Public API ----

export async function login(division: string, password: string): Promise<LoginResult> {
  return post<LoginResult>({ action: 'login', division, password })
}

export async function fetchAll(): Promise<DashboardData> {
  const raw = await get<{ divisions: RawDivision[] }>({ action: 'getAll' })
  return {
    divisions: (raw.divisions || []).map(hydrateDivision),
    fetchedAt: new Date().toISOString(),
  }
}

export async function fetchDivision(division: string): Promise<Division> {
  const raw = await get<{ division: RawDivision }>({ action: 'getDivision', division })
  return hydrateDivision(raw.division)
}

export async function updateTask(
  division: string,
  password: string,
  task: Pick<Task, 'row' | 'status' | 'catatan' | 'link' | 'pic'>,
): Promise<{ ok: boolean }> {
  return post({
    action: 'updateTask',
    division,
    password,
    row: task.row,
    status: task.status,
    catatan: task.catatan,
    link: task.link,
    pic: task.pic,
  })
}

export async function addTask(
  division: string,
  password: string,
  task: Omit<Task, 'row'>,
): Promise<{ ok: boolean; row: number }> {
  return post({
    action: 'addTask',
    division,
    password,
    jobdesc: task.jobdesc,
    waktu: task.waktu,
    subtask: task.subtask,
    status: task.status,
    link: task.link,
    pic: task.pic,
    catatan: task.catatan,
  })
}

export async function deleteTask(
  division: string,
  password: string,
  row: number,
): Promise<{ ok: boolean }> {
  return post({ action: 'deleteTask', division, password, row })
}

export { ApiError }
