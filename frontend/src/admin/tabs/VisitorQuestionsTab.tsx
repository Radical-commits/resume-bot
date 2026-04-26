import { useState, useEffect, useMemo } from 'react'
import { adminApi, ExchangeRow } from '../adminApi'

const PAGE_SIZE = 20

function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i)
  return h >>> 0
}

function sessionColor(sessionId: string): string {
  const hue = djb2(sessionId) % 360
  return `hsl(${hue}, 55%, 58%)`
}

function relTime(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) {
    const h = Math.floor(secs / 3600)
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`
  }
  const d = Math.floor(secs / 86400)
  return `${d} ${d === 1 ? 'day' : 'days'} ago`
}

function ConvoRow({ c }: { c: ExchangeRow }) {
  const color = sessionColor(c.sessionId)
  // Take 6 chars from the last underscore-separated segment so session_ts_abc → abc123
  const shortId = (c.sessionId.split('_').pop() ?? c.sessionId).slice(0, 6)

  return (
    <article className="convo">
      <div className="convo-cols">
        <div className="convo-col">
          <div className="convo-role">Visitor asked</div>
          <p className="convo-text convo-q">{c.question}</p>
        </div>
        <div className="convo-divider" />
        <div className="convo-col">
          <div className="convo-role">Bot answered</div>
          <p className="convo-text convo-a">{c.response}</p>
        </div>
      </div>
      <footer className="convo-foot">
        <span className="convo-time mono">{relTime(c.ts)}</span>
        <span className="convo-foot-sep" />
        <span className="convo-lat mono">{c.latencyMs}ms</span>
        <span className="convo-foot-sep" />
        <span className="convo-session">
          <span className="convo-dot" style={{ background: color }} />
          <span className="mono">{shortId}</span>
        </span>
        {c.refused && (
          <>
            <span className="convo-foot-sep" />
            <span className="chip chip-refused">refused</span>
          </>
        )}
      </footer>
    </article>
  )
}

function EmptyConvos() {
  return (
    <div className="empty">
      <div className="empty-glyph mono">∅</div>
      <div className="empty-title">No conversations yet</div>
      <div className="empty-sub">
        When a visitor opens the chat on your portfolio, their conversation will land here.
      </div>
    </div>
  )
}

export function VisitorQuestionsTab() {
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [exchanges, setExchanges] = useState<ExchangeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    adminApi.getExchanges(page, PAGE_SIZE)
      .then(data => {
        setExchanges(data.exchanges)
        setTotal(data.total)
      })
      .catch(() => setError('Failed to load conversations.'))
      .finally(() => setLoading(false))
  }, [page])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const start = page * PAGE_SIZE
  const end = Math.min(start + PAGE_SIZE, total)

  const subtitle = useMemo(() => {
    if (total > 0) return <>Latest <span className="mono">{total}</span> conversations from your portfolio chat.</>
    return <>Latest conversations from your portfolio chat will appear here.</>
  }, [total])

  return (
    <main className="main">
      <div className="tab-bar">
        <div className="tab-bar-title">
          <h1 className="tab-bar-h">Visitor Questions</h1>
          <p className="tab-bar-sub">{subtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="empty">
          <div className="empty-sub mono">Loading…</div>
        </div>
      ) : error ? (
        <div className="empty">
          <div className="empty-sub">{error}</div>
        </div>
      ) : total === 0 ? (
        <EmptyConvos />
      ) : (
        <>
          <div className="convo-list">
            {exchanges.map(c => <ConvoRow key={c.id} c={c} />)}
          </div>
          <nav className="pager">
            <button
              className="btn btn-ghost"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              ← Previous
            </button>
            <div className="pager-status mono">
              Showing {start + 1}–{end} of {total} conversations
            </div>
            <button
              className="btn btn-ghost"
              disabled={page >= pages - 1}
              onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
            >
              Next →
            </button>
          </nav>
        </>
      )}
    </main>
  )
}
