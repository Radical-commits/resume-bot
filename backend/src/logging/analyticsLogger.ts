import { getDatabase } from './db.js'
import type { AnalyticsEvent } from './analyticsTypes.js'

export function logAnalyticsEvent(event: AnalyticsEvent): void {
  try {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO analytics_events (ts, session_id, event_type, section, language, extra)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      event.ts,
      event.sessionId,
      event.eventType,
      event.section ?? null,
      event.language ?? null,
      event.extra ? JSON.stringify(event.extra) : null
    )
  } catch (err) {
    console.error('Analytics logging failed:', err)
  }
}
