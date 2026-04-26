import { getDatabase } from '../logging/db.js'
import { aiService } from './aiService.js'

interface InsightsTopic {
  label: string
  count: number
  examples: string[]
}

export interface InsightsPayload {
  topics: InsightsTopic[]
  refusalRate: number
  refusalCount: number
  totalConversations: number
  coverageGaps: string[]
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const MAX_EXCERPTS = 60

export function getInsightsCache(): { status: string; generated_at: number; payload: InsightsPayload | null } | null {
  const db = getDatabase()
  const row = db.prepare('SELECT status, generated_at, payload FROM insights_cache WHERE id = 1').get() as
    | { status: string; generated_at: number; payload: string | null }
    | undefined
  if (!row) return null
  return {
    status: row.status,
    generated_at: row.generated_at,
    payload: row.payload ? JSON.parse(row.payload) : null,
  }
}

function upsertCacheStatus(status: string, payload?: InsightsPayload) {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO insights_cache (id, generated_at, status, payload)
    VALUES (1, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET generated_at = excluded.generated_at, status = excluded.status, payload = excluded.payload
  `).run(Date.now(), status, payload ? JSON.stringify(payload) : null)
}

export function shouldRegenerate(): boolean {
  const cache = getInsightsCache()
  if (!cache) return true
  if (cache.status === 'generating') return false
  return Date.now() - cache.generated_at > SEVEN_DAYS_MS
}

export async function generateInsights(): Promise<void> {
  const db = getDatabase()
  const since = Date.now() - THIRTY_DAYS_MS

  const rows = db.prepare(`
    SELECT prompt_excerpt, response_excerpt
    FROM ai_audit_log
    WHERE event_type = 'chat'
      AND ts >= ?
      AND (response_excerpt NOT LIKE 'I''m only here%')
    ORDER BY ts DESC
    LIMIT ?
  `).all(since, MAX_EXCERPTS) as { prompt_excerpt: string; response_excerpt: string }[]

  const refusedCount = (db.prepare(`
    SELECT COUNT(*) as n FROM ai_audit_log
    WHERE event_type = 'chat' AND ts >= ? AND response_excerpt LIKE 'I''m only here%'
  `).get(since) as { n: number }).n

  const totalCount = (db.prepare(`
    SELECT COUNT(*) as n FROM ai_audit_log WHERE event_type = 'chat' AND ts >= ?
  `).get(since) as { n: number }).n

  if (rows.length === 0) {
    upsertCacheStatus('ready', {
      topics: [],
      refusalRate: totalCount > 0 ? refusedCount / totalCount : 0,
      refusalCount: refusedCount,
      totalConversations: totalCount,
      coverageGaps: [],
    })
    return
  }

  const excerptBlock = rows
    .map((r, i) => `[${i + 1}] Q: ${r.prompt_excerpt}\n    A: ${r.response_excerpt}`)
    .join('\n\n')

  const prompt = `You are analyzing conversations from a personal resume chatbot. The bot answers questions about a candidate's professional background.

Below are up to ${rows.length} recent Q&A excerpts (truncated to ~200 chars each). Analyze them and return a JSON object with this exact shape:

{
  "topics": [
    { "label": "short topic name", "count": <number of questions on this topic>, "examples": ["question 1", "question 2"] }
  ],
  "coverageGaps": ["question the bot couldn't answer 1", "question 2"]
}

Rules:
- Group questions into 4–8 meaningful topic clusters (e.g. "React / Frontend", "Leadership", "Career history")
- For each topic include 2–3 representative example questions verbatim from the excerpts
- coverageGaps: questions where the bot said it didn't have that information (look for "not available", "don't have that information", "not in the resume")
- Return ONLY the JSON object, no markdown, no explanation

Excerpts:
${excerptBlock}`

  try {
    const response = await aiService.chat([{ role: 'user', content: prompt }])
    const parsed = JSON.parse(response.content.trim()) as { topics: InsightsTopic[]; coverageGaps: string[] }

    upsertCacheStatus('ready', {
      topics: parsed.topics || [],
      refusalRate: totalCount > 0 ? refusedCount / totalCount : 0,
      refusalCount: refusedCount,
      totalConversations: totalCount,
      coverageGaps: parsed.coverageGaps || [],
    })
  } catch (err) {
    console.error('Insights generation failed:', err)
    upsertCacheStatus('error')
  }
}
