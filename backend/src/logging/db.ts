import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database
let dbPath: string

export function initDatabase(): Database.Database {
  if (db) return db

  const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs')
  fs.mkdirSync(logsDir, { recursive: true })

  dbPath = path.join(logsDir, 'analytics.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ts         INTEGER NOT NULL,
      session_id TEXT    NOT NULL,
      event_type TEXT    NOT NULL,
      section    TEXT,
      language   TEXT,
      extra      TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_ae_ts         ON analytics_events(ts);
    CREATE INDEX IF NOT EXISTS idx_ae_event_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_ae_session    ON analytics_events(session_id);

    CREATE TABLE IF NOT EXISTS ai_audit_log (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      ts                INTEGER NOT NULL,
      session_id        TEXT    NOT NULL,
      event_type        TEXT    NOT NULL,
      provider          TEXT    NOT NULL,
      model             TEXT    NOT NULL,
      prompt_tokens     INTEGER,
      completion_tokens INTEGER,
      total_tokens      INTEGER,
      latency_ms        INTEGER NOT NULL,
      prompt_excerpt    TEXT,
      response_excerpt  TEXT,
      fit_score         INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_aal_ts         ON ai_audit_log(ts);
    CREATE INDEX IF NOT EXISTS idx_aal_session    ON ai_audit_log(session_id);
    CREATE INDEX IF NOT EXISTS idx_aal_event_type ON ai_audit_log(event_type);
  `)

  console.log(`Analytics database initialized at: ${dbPath}`)
  return db
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function getDatabasePath(): string {
  return dbPath
}
