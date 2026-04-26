import { getDatabase } from './db.js'
import type { AuditLogEntry } from './auditTypes.js'

export function logAuditEntry(entry: AuditLogEntry): void {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO ai_audit_log (
        ts, session_id, event_type, provider, model,
        prompt_tokens, completion_tokens, total_tokens,
        latency_ms, prompt_excerpt, response_excerpt, fit_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      entry.ts,
      entry.sessionId,
      entry.eventType,
      entry.provider,
      entry.model,
      entry.promptTokens ?? null,
      entry.completionTokens ?? null,
      entry.totalTokens ?? null,
      entry.latencyMs,
      entry.promptExcerpt ?? null,
      entry.responseExcerpt ?? null,
      entry.fitScore ?? null
    )
  } catch (err) {
    console.error('Audit logging failed:', err)
  }
}
