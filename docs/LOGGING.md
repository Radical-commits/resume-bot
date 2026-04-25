# Logging System

This document covers the two logging systems built into resume-bot: an **AI audit log** that records every AI call, and a **visitor analytics log** that tracks anonymous interaction events. It explains what is stored, how to query it, and how to maintain it.

---

## Overview

| System | Table | What it captures |
|---|---|---|
| AI Audit Log | `ai_audit_log` | Every chat and job-fit AI call — tokens, latency, model, excerpts |
| Visitor Analytics | `analytics_events` | Anonymous visitor interactions — chat opens, messages sent, feature usage |

Both tables live in a single SQLite database at `/app/logs/analytics.db` inside the container, backed by a named Docker volume (`logs_data`) that persists across restarts.

---

## Querying the Database

SQLite is not installed inside the container. Use one of these two approaches:

### Option A — Query via host (recommended for regular use)

Install sqlite3 on the host machine once:
```bash
sudo apt install sqlite3
```

Then query directly against the Docker volume:
```bash
sqlite3 /var/lib/docker/volumes/cv-chat-app_logs_data/_data/analytics.db "<query>"
```

To find the exact volume path on your system:
```bash
docker volume inspect logs_data
# Look for the "Mountpoint" field
```

### Option B — Copy the DB file out temporarily

```bash
docker cp cv-chat-app-app-1:/app/logs/analytics.db ./analytics.db
sqlite3 ./analytics.db "<query>"
```

Useful for a one-off inspection or to open the file in a GUI tool like [DB Browser for SQLite](https://sqlitebrowser.org).

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

---

## Admin API

`GET /api/admin/analytics/summary` returns aggregate counts without requiring direct DB access. Protected by an `ADMIN_TOKEN` Bearer token set in `.env`.

### Request

```bash
curl -H "Authorization: Bearer your-token-here" \
  https://your-domain.com/api/admin/analytics/summary
```

### Response

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
      "total_tokens": 1554
    }
  ],
  "avgLatency": [
    { "event_type": "chat", "avg_latency_ms": 1018, "count": 1 }
  ]
}
```

### Response Fields

| Field | Description |
|---|---|
| `sessionsPerDay` | Unique sessions per calendar day |
| `eventCounts` | Total count of each analytics event type |
| `modelUsage` | Per-model request count and total tokens consumed |
| `avgLatency` | Average AI call latency in ms, grouped by event type |

---

## Environment Variables

| Variable | Default (Docker) | Description |
|---|---|---|
| `LOGS_DIR` | `/app/logs` | Directory where `analytics.db` is written |
