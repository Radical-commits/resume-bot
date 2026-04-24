import { Request, Response } from 'express'
import { getDatabase } from '../logging/db.js'

export function getAnalyticsSummary(req: Request, res: Response): void {
  const adminToken = process.env.ADMIN_TOKEN
  const authHeader = req.headers['authorization']

  if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const db = getDatabase()

  const sessionsPerDay = db.prepare(`
    SELECT date(ts / 1000, 'unixepoch') AS day, COUNT(DISTINCT session_id) AS sessions
    FROM analytics_events
    GROUP BY day
    ORDER BY day DESC
  `).all()

  const eventCounts = db.prepare(`
    SELECT event_type, COUNT(*) AS count
    FROM analytics_events
    GROUP BY event_type
    ORDER BY count DESC
  `).all()

  const modelUsage = db.prepare(`
    SELECT model, provider, COUNT(*) AS requests,
           SUM(total_tokens) AS total_tokens
    FROM ai_audit_log
    GROUP BY model, provider
    ORDER BY requests DESC
  `).all()

  const avgLatency = db.prepare(`
    SELECT event_type, ROUND(AVG(latency_ms)) AS avg_latency_ms, COUNT(*) AS count
    FROM ai_audit_log
    GROUP BY event_type
    ORDER BY avg_latency_ms DESC
  `).all()

  res.json({ sessionsPerDay, eventCounts, modelUsage, avgLatency })
}
