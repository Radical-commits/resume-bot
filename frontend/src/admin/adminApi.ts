const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3001')

const TOKEN_KEY = 'admin_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json() as Promise<T>
}

export interface DailySessions {
  day: string
  sessions: number
}

export interface DailyTokens {
  day: string
  tokens_in: number
  tokens_out: number
  total_tokens: number
}

export interface EventCount {
  event_type: string
  count: number
}

export interface ModelUsage {
  model: string
  provider: string
  requests: number
  total_tokens: number
  tokens_in: number
  tokens_out: number
}

export interface LatencyStats {
  event_type: string
  avg_latency_ms: number
  max_latency_ms: number
  slow_count: number
  count: number
}

export interface AdminSummary {
  sessionsPerDay: DailySessions[]
  eventCounts: EventCount[]
  modelUsage: ModelUsage[]
  latency: LatencyStats[]
  dailyTokens: DailyTokens[]
}

export interface DbStatus {
  sizeMB: number
  analyticsEvents: number
  aiAuditLog: number
  prunable: number
}

export const adminApi = {
  verifyToken: async (token: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/api/admin/analytics/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  },
  getSummary: () => adminFetch<AdminSummary>('/api/admin/analytics/summary'),
  getDbStatus: () => adminFetch<DbStatus>('/api/admin/db/status'),
  pruneDatabase: () => adminFetch<{ deleted: number }>('/api/admin/db/prune', { method: 'POST' }),
}
