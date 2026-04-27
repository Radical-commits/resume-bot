# Analytics & Admin

This document covers the two data-collection systems built into resume-bot — an **AI audit log** and a **visitor analytics log** — plus the **admin console** that visualises them and the **API** that powers it. It explains what is stored, how to query it, and how to maintain it.

---

## Overview

| System | Table | What it captures |
|---|---|---|
| AI Audit Log | `ai_audit_log` | Every chat and job-fit AI call — tokens, latency, model, excerpts |
| Visitor Analytics | `analytics_events` | Anonymous visitor interactions — chat opens, messages sent, feature usage |
| Insights Cache | `insights_cache` | AI-generated topic clusters and coverage analysis, regenerated every 7 days |

Both tables live in a single SQLite database at `/app/logs/analytics.db` inside the container, backed by a named Docker volume (`logs_data`) that persists across restarts.

---

## Admin Console

The admin console is the primary interface for monitoring the site. Navigate to `/admin` in a browser.

**Auth:** Enter the `ADMIN_TOKEN` value from `.env` on the login screen. The token is stored in `localStorage`; revisiting `/admin` skips the login screen if the stored token is still valid.

The console is code-split into the React bundle — the admin JavaScript is only downloaded when `/admin` is first visited.

### Dashboard cards

| Card | What it shows |
|---|---|
| **Activity** | Unique sessions count, average sessions/day, daily sessions sparkline |
| **Token Usage** | Tokens in / tokens out, provider chip + model name, daily tokens sparkline |
| **LLM Latency** | Table: event type / avg latency / max latency / slow calls (>5 s flagged amber) |
| **Database** | File size (MB), row counts, prunable row count, **Prune (90 d)** button |

### Insights tab

Shows an AI-generated analysis of visitor conversations from the past 30 days. Data is cached and regenerated automatically after 7 days; a **Regenerate** button forces an immediate refresh.

| Section | What it shows |
|---|---|
| **Topics** | AI-clustered conversation topics — label, question count, and up to 3 example questions per cluster |
| **Off-topic Attempts** | Refusal count and share of total conversations (responses starting with "I'm only here") |
| **Coverage Gaps** | Questions the bot couldn't answer, extracted from responses that indicated missing information |

While analysis is running the tab shows a loading skeleton; it polls every 2 seconds until `status` becomes `ready` or `error`. A timestamp shows when the current snapshot was generated.

### Visitor Questions tab

A paginated log of individual chat exchanges — 20 per page, newest first.

| Field | Description |
|---|---|
| Question | Visitor's message (from `prompt_excerpt`) |
| Response | Bot's reply (from `response_excerpt`) |
| Time | Relative timestamp (e.g. "3 hours ago") |
| Latency | Response time in milliseconds |
| Session | Abbreviated session ID with a colour-coded dot |
| Refused chip | Shown when the bot declined to answer (response starts with "I'm only here") |

### Time range toggle

The header has a **7 d / 30 d** toggle. Filtering is applied client-side against the 30-day payload returned by the API — switching does not trigger a new network request.

### Refresh

Manual refresh only. A spin animation plays while data loads; the header shows a last-refreshed timestamp.

---

## Querying the Database Directly

Raw SQL access is available for ad-hoc investigation. SQLite is not installed inside the container; use one of these approaches.

### Option A — Query via host (recommended)

Install sqlite3 on the host once:
```bash
sudo apt install sqlite3
```

Then query directly against the Docker volume:
```bash
sqlite3 /var/lib/docker/volumes/cv-chat-app_logs_data/_data/analytics.db "<query>"
```

To find the exact volume path:
```bash
docker volume inspect logs_data
# Look for the "Mountpoint" field
```

### Option B — Copy the DB file out temporarily

```bash
docker cp cv-chat-app-app-1:/app/logs/analytics.db ./analytics.db
sqlite3 ./analytics.db "<query>"
```

Useful for one-off inspection or to open the file in a GUI tool like [DB Browser for SQLite](https://sqlitebrowser.org).

---

## AI Audit Log

### Schema

| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-incrementing primary key |
| ts | INTEGER | Unix epoch milliseconds |
| session_id | TEXT | Opaque frontend session token |
| event_type | TEXT | `chat` or `job_fit` |
| provider | TEXT | `groq`, `openai`, or `google` |
| model | TEXT | Model name from config |
| prompt_tokens | INTEGER | Tokens used for the prompt |
| completion_tokens | INTEGER | Tokens used for the response |
| total_tokens | INTEGER | Total tokens for the call |
| latency_ms | INTEGER | Wall-clock time around the AI call |
| prompt_excerpt | TEXT | First 200 chars of user message only |
| response_excerpt | TEXT | First 200 chars of AI response |
| fit_score | INTEGER | Job fit score (job_fit events only) |

> **Privacy note:** The system prompt is never stored. Only the user's message is excerpted, truncated to 200 characters.

### Common Queries

**Most recent AI calls:**
```sql
SELECT ts, event_type, provider, model, total_tokens, latency_ms
FROM ai_audit_log
ORDER BY ts DESC
LIMIT 10;
```

**Token usage by model (all time):**
```sql
SELECT model, provider,
  COUNT(*) AS calls,
  SUM(total_tokens) AS total_tokens,
  AVG(total_tokens) AS avg_tokens_per_call
FROM ai_audit_log
GROUP BY model, provider
ORDER BY total_tokens DESC;
```

**Average latency by provider:**
```sql
SELECT provider,
  COUNT(*) AS calls,
  AVG(latency_ms) AS avg_latency_ms,
  MAX(latency_ms) AS max_latency_ms
FROM ai_audit_log
GROUP BY provider;
```

**Daily call volume:**
```sql
SELECT DATE(ts / 1000, 'unixepoch') AS day,
  COUNT(*) AS calls,
  SUM(total_tokens) AS tokens
FROM ai_audit_log
GROUP BY day
ORDER BY day DESC;
```

**Slow calls (latency over 5 seconds):**
```sql
SELECT ts, provider, model, latency_ms, prompt_excerpt
FROM ai_audit_log
WHERE latency_ms > 5000
ORDER BY latency_ms DESC;
```

**Job fit assessments with scores:**
```sql
SELECT ts, session_id, fit_score, total_tokens, latency_ms
FROM ai_audit_log
WHERE event_type = 'job_fit'
ORDER BY ts DESC;
```

---

## Visitor Analytics

### Schema

| Column | Type | Description |
|---|---|---|
| id | INTEGER | Auto-incrementing primary key |
| ts | INTEGER | Unix epoch milliseconds |
| session_id | TEXT | Opaque frontend session token |
| event_type | TEXT | See event types below |
| section | TEXT | Section name (section_view events only) |
| language | TEXT | Language code (language_switched events only) |
| extra | TEXT | JSON blob, max 512 chars (optional metadata) |

### Event Types

| Event | Trigger |
|---|---|
| `session_start` | New visitor session created |
| `section_view` | About / Experience / Skills / Education scrolled into view |
| `chat_open` | Chat widget opened |
| `message_sent` | User sends a chat message |
| `job_fit_used` | Job fit assessment completed |
| `language_switched` | Language toggled |
| `feature_button_click` | Header/hero chat or job fit button clicked |

### Common Queries

**Event volume by type:**
```sql
SELECT event_type,
  COUNT(*) AS count
FROM analytics_events
GROUP BY event_type
ORDER BY count DESC;
```

**Daily active sessions:**
```sql
SELECT DATE(ts / 1000, 'unixepoch') AS day,
  COUNT(DISTINCT session_id) AS sessions
FROM analytics_events
GROUP BY day
ORDER BY day DESC;
```

**Chat funnel — opens vs messages sent:**
```sql
SELECT
  SUM(CASE WHEN event_type = 'chat_open' THEN 1 ELSE 0 END) AS chat_opens,
  SUM(CASE WHEN event_type = 'message_sent' THEN 1 ELSE 0 END) AS messages_sent,
  SUM(CASE WHEN event_type = 'job_fit_used' THEN 1 ELSE 0 END) AS job_fit_completions
FROM analytics_events;
```

**Language usage breakdown:**
```sql
SELECT language, COUNT(*) AS switches
FROM analytics_events
WHERE event_type = 'language_switched'
GROUP BY language;
```

**Sessions in the last 7 days:**
```sql
SELECT DATE(ts / 1000, 'unixepoch') AS day,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(*) AS total_events
FROM analytics_events
WHERE ts > (strftime('%s', 'now') - 7 * 86400) * 1000
GROUP BY day
ORDER BY day DESC;
```

### `insights_cache`

Singleton table (always one row, `id = 1`) that stores the most recent AI-generated insights.

| Column | Type | Description |
|---|---|---|
| id | INTEGER | Always 1 |
| generated_at | INTEGER | Unix epoch milliseconds when generation started |
| status | TEXT | `generating`, `ready`, or `error` |
| payload | TEXT | JSON-encoded insights (null while generating) |

The payload JSON shape:

```json
{
  "topics": [{ "label": "React / Frontend", "count": 12, "examples": ["Do you know Next.js?"] }],
  "refusalRate": 0.05,
  "refusalCount": 3,
  "totalConversations": 60,
  "coverageGaps": ["What is your expected salary?"]
}
```

Stale threshold: 7 days. The row is upserted on every generation cycle; there is always at most one row.

---

## Cross-Table Queries

Both tables share `session_id`, allowing you to correlate visitor behaviour with AI usage.

**AI token cost per session:**
```sql
SELECT a.session_id,
  COUNT(DISTINCT e.id) AS events,
  COUNT(DISTINCT a.id) AS ai_calls,
  SUM(a.total_tokens) AS tokens
FROM ai_audit_log a
LEFT JOIN analytics_events e ON e.session_id = a.session_id
GROUP BY a.session_id
ORDER BY tokens DESC
LIMIT 20;
```

---

## Maintenance

> **Preferred method:** use the Database card in the admin console at `/admin` — it shows file size, row counts, and prunable count before you confirm, then runs both deletes in one click.

The commands below are available as a fallback for headless or scripted use.

### Check database file size
```bash
docker exec cv-chat-app-app-1 ls -lh /app/logs/analytics.db
```

### Backup the database
```bash
docker cp cv-chat-app-app-1:/app/logs/analytics.db \
  ./analytics_backup_$(date +%Y%m%d).db
```

Automate with a cron job on the host for regular backups.

### Prune old analytics events (keep last 90 days)
```sql
DELETE FROM analytics_events
WHERE ts < (strftime('%s', 'now') - 90 * 86400) * 1000;
```

### Prune old audit log entries (keep last 90 days)
```sql
DELETE FROM ai_audit_log
WHERE ts < (strftime('%s', 'now') - 90 * 86400) * 1000;
```

Run `VACUUM` after large deletes to reclaim disk space:
```sql
VACUUM;
```

### Verify data is being written
After sending a chat message, confirm a row landed in both tables:
```sql
SELECT * FROM ai_audit_log ORDER BY ts DESC LIMIT 1;
SELECT * FROM analytics_events ORDER BY ts DESC LIMIT 1;
```

### Verify volume survives restart
```bash
docker-compose down && docker-compose up -d
sqlite3 /var/lib/docker/volumes/cv-chat-app_logs_data/_data/analytics.db \
  "SELECT COUNT(*) FROM ai_audit_log;"
```
Row count should be unchanged.

### Insights cache

`insights_cache` is not pruned by the **Prune (90 d)** button or the `/api/admin/db/prune` endpoint — it contains at most one row and is managed automatically. To force a fresh analysis, use the **Regenerate** button on the Insights tab or call `POST /api/admin/analytics/insights/refresh`.

---

## Admin API

All endpoints require `Authorization: Bearer <ADMIN_TOKEN>`.

### `GET /api/admin/analytics/summary`

Returns 30 days of aggregated data used by the admin dashboard.

```bash
curl -H "Authorization: Bearer your-token-here" \
  https://your-domain.com/api/admin/analytics/summary
```

```json
{
  "sessionsPerDay": [
    { "day": "2026-04-24", "sessions": 1 }
  ],
  "eventCounts": [
    { "event_type": "section_view", "count": 4 },
    { "event_type": "chat_open", "count": 1 },
    { "event_type": "message_sent", "count": 1 }
  ],
  "modelUsage": [
    {
      "model": "llama-3.3-70b-versatile",
      "provider": "groq",
      "requests": 1,
      "total_tokens": 1554,
      "tokens_in": 1200,
      "tokens_out": 354
    }
  ],
  "latency": [
    {
      "event_type": "chat",
      "avg_latency_ms": 1018,
      "max_latency_ms": 2340,
      "count": 1,
      "slow_count": 0
    }
  ],
  "dailyTokens": [
    { "day": "2026-04-24", "tokens_in": 1200, "tokens_out": 354, "total_tokens": 1554 }
  ]
}
```

| Field | Description |
|---|---|
| `sessionsPerDay` | Unique sessions per calendar day, last 30 days, ASC |
| `eventCounts` | Total count of each analytics event type (all time) |
| `modelUsage` | Per-model request count and token breakdown (prompt / completion / total) |
| `latency` | Avg and max latency in ms per event type; `slow_count` = calls over 5 s |
| `dailyTokens` | Daily token breakdown (prompt / completion / total), last 30 days, ASC |

The 7 d / 30 d toggle in the dashboard filters `sessionsPerDay` and `dailyTokens` client-side — no separate endpoint for the shorter window.

---

### `GET /api/admin/db/status`

Returns current database size and row counts.

```bash
curl -H "Authorization: Bearer your-token-here" \
  https://your-domain.com/api/admin/db/status
```

```json
{
  "sizeMB": 0.4,
  "analyticsEvents": 42,
  "aiAuditLog": 17,
  "prunable": 0
}
```

| Field | Description |
|---|---|
| `sizeMB` | Database file size in MB (one decimal place) |
| `analyticsEvents` | Total row count in `analytics_events` |
| `aiAuditLog` | Total row count in `ai_audit_log` |
| `prunable` | Combined rows older than 90 days across both tables |

---

### `POST /api/admin/db/prune`

Deletes all rows older than 90 days from both tables. No request body required.

```bash
curl -X POST -H "Authorization: Bearer your-token-here" \
  https://your-domain.com/api/admin/db/prune
```

```json
{ "deleted": 8 }
```

| Field | Description |
|---|---|
| `deleted` | Total rows removed across both tables |

---

### `GET /api/admin/analytics/exchanges`

Returns a paginated list of individual chat conversations drawn from `ai_audit_log`.

**Query parameters:**

| Parameter | Default | Description |
|---|---|---|
| `page` | `0` | Zero-indexed page number |
| `limit` | `20` | Items per page (max 50) |

```bash
curl -H "Authorization: Bearer your-token-here" \
  "https://your-domain.com/api/admin/analytics/exchanges?page=0&limit=20"
```

```json
{
  "exchanges": [
    {
      "id": 17,
      "ts": 1745530000000,
      "sessionId": "abc123",
      "latencyMs": 1180,
      "question": "What frameworks do you know?",
      "response": "I have experience with React, Node.js ...",
      "refused": false
    }
  ],
  "total": 42,
  "page": 0,
  "limit": 20
}
```

| Field | Description |
|---|---|
| `exchanges` | Array of chat exchanges for this page, newest first |
| `total` | Total chat rows in `ai_audit_log` |
| `page` | Current page (0-indexed) |
| `limit` | Page size used |
| `refused` | `true` when the response excerpt begins with "I'm only here" |

---

### `GET /api/admin/analytics/insights`

Returns the current insights cache. If the cache is absent or older than 7 days, background generation is triggered automatically and `status` is returned as `generating`.

```bash
curl -H "Authorization: Bearer your-token-here" \
  https://your-domain.com/api/admin/analytics/insights
```

```json
{
  "status": "ready",
  "generatedAt": 1745530000000,
  "data": {
    "topics": [
      { "label": "React / Frontend", "count": 12, "examples": ["Do you know Next.js?"] }
    ],
    "refusalRate": 0.05,
    "refusalCount": 3,
    "totalConversations": 60,
    "coverageGaps": ["What is your expected salary?"]
  }
}
```

| Field | Description |
|---|---|
| `status` | `generating` — analysis in progress; `ready` — data available; `error` — generation failed |
| `generatedAt` | Unix epoch milliseconds of last generation attempt, or `null` |
| `data` | Full insights payload when `status = ready`, otherwise `null` |
| `data.topics` | 4–8 AI-clustered topic groups with label, count, and example questions |
| `data.refusalRate` | Fraction of conversations the bot declined (0–1) |
| `data.coverageGaps` | Questions the bot said it couldn't answer |

Poll this endpoint every 2 seconds while `status = generating`.

---

### `POST /api/admin/analytics/insights/refresh`

Forces insights regeneration regardless of cache age. Sets `status` to `generating` immediately; generation proceeds asynchronously.

```bash
curl -X POST -H "Authorization: Bearer your-token-here" \
  https://your-domain.com/api/admin/analytics/insights/refresh
```

```json
{ "status": "generating" }
```

After calling this endpoint, poll `GET /api/admin/analytics/insights` until `status` is no longer `generating`.

---

## Environment Variables

| Variable | Default (Docker) | Description |
|---|---|---|
| `LOGS_DIR` | `/app/logs` | Directory where `analytics.db` is written |
| `ADMIN_TOKEN` | — | Bearer token required for all `/api/admin/*` endpoints |
