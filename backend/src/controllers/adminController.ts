import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import { getDatabase, getDatabasePath } from '../logging/db.js'

export function requireAdminToken(req: Request, res: Response, next: NextFunction): void {
  const adminToken = process.env.ADMIN_TOKEN
  const authHeader = req.headers['authorization']
  if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

export function getAnalyticsSummary(_req: Request, res: Response): void {
  const db = getDatabase()
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000

  const sessionsPerDay = db.prepare(`
    SELECT date(ts / 1000, 'unixepoch') AS day, COUNT(DISTINCT session_id) AS sessions
    FROM analytics_events
    WHERE ts >= ?
    GROUP BY day
    ORDER BY day ASC
  `).all(cutoff)

  const eventCounts = db.prepare(`
    SELECT event_type, COUNT(*) AS count
    FROM analytics_events
    GROUP BY event_type
    ORDER BY count DESC
  `).all()

  const modelUsage = db.prepare(`
    SELECT model, provider,
           COUNT(*) AS requests,
           SUM(total_tokens) AS total_tokens,
           SUM(prompt_tokens) AS tokens_in,
           SUM(completion_tokens) AS tokens_out
    FROM ai_audit_log
    GROUP BY model, provider
    ORDER BY requests DESC
  `).all()

  const latency = db.prepare(`
    SELECT event_type,
           ROUND(AVG(latency_ms)) AS avg_latency_ms,
           MAX(latency_ms) AS max_latency_ms,
           COUNT(*) AS count,
           SUM(CASE WHEN latency_ms > 5000 THEN 1 ELSE 0 END) AS slow_count
    FROM ai_audit_log
    GROUP BY event_type
    ORDER BY avg_latency_ms DESC
  `).all()

  const dailyTokens = db.prepare(`
    SELECT date(ts / 1000, 'unixepoch') AS day,
           SUM(prompt_tokens) AS tokens_in,
           SUM(completion_tokens) AS tokens_out,
           SUM(total_tokens) AS total_tokens
    FROM ai_audit_log
    WHERE ts >= ?
    GROUP BY day
    ORDER BY day ASC
  `).all(cutoff)

  res.json({ sessionsPerDay, eventCounts, modelUsage, latency, dailyTokens })
}

export function getDbStatus(_req: Request, res: Response): void {
  const db = getDatabase()
  const path = getDatabasePath()

  let sizeMB = 0
  try {
    const stat = fs.statSync(path)
    sizeMB = Math.round((stat.size / (1024 * 1024)) * 10) / 10
  } catch {
    // file not yet written (e.g. empty WAL)
  }

  const analyticsEvents = (db.prepare('SELECT COUNT(*) AS n FROM analytics_events').get() as { n: number }).n
  const aiAuditLog = (db.prepare('SELECT COUNT(*) AS n FROM ai_audit_log').get() as { n: number }).n

  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
  const oldAnalytics = (db.prepare('SELECT COUNT(*) AS n FROM analytics_events WHERE ts < ?').get(cutoff) as { n: number }).n
  const oldAudit = (db.prepare('SELECT COUNT(*) AS n FROM ai_audit_log WHERE ts < ?').get(cutoff) as { n: number }).n

  res.json({ sizeMB, analyticsEvents, aiAuditLog, prunable: oldAnalytics + oldAudit })
}

export function pruneDatabase(_req: Request, res: Response): void {
  const db = getDatabase()
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000

  const r1 = db.prepare('DELETE FROM analytics_events WHERE ts < ?').run(cutoff)
  const r2 = db.prepare('DELETE FROM ai_audit_log WHERE ts < ?').run(cutoff)

  res.json({ deleted: r1.changes + r2.changes })
}
