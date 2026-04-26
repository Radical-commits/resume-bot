export type AuditEventType = 'chat' | 'job_fit'

export interface AuditLogEntry {
  ts: number
  sessionId: string
  eventType: AuditEventType
  provider: string
  model: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  latencyMs: number
  promptExcerpt?: string
  responseExcerpt?: string
  fitScore?: number
}
