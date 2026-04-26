import { useState, useEffect, useRef } from 'react'
import { adminApi, InsightsPayload, InsightsTopic } from '../adminApi'

function relTime(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  const h = Math.floor(secs / 3600)
  return `${h} ${h === 1 ? 'hour' : 'hours'} ago`
}

function TopicChip({ topic }: { topic: InsightsTopic }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`topic-chip${open ? ' open' : ''}`}>
      <button className="topic-head" onClick={() => setOpen(o => !o)}>
        <span className="topic-label">{topic.label}</span>
        <span className="topic-count mono">{topic.count} questions</span>
        <span className="topic-caret mono">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="topic-body">
          <div className="topic-body-label mono">
            showing {topic.examples.length} of {topic.count} examples
          </div>
          {topic.examples.map((q, i) => (
            <div key={i} className="topic-example">
              <span className="topic-quote">"</span>
              <span>{q}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InsightsLoading() {
  return (
    <div className="insights-loading">
      <div className="insights-loading-label">
        <span className="loading-dot" />
        <span className="mono">Analyzing conversations…</span>
      </div>
      <section className="card pulse">
        <header className="card-head">
          <div className="card-title-wrap">
            <h2 className="card-title">Topics</h2>
          </div>
        </header>
        <div className="card-body">
          <div className="topic-grid">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="topic-chip skeleton-chip">
                <div className="sk-bar sk-bar-a" />
                <div className="sk-bar sk-bar-b" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="card pulse">
        <header className="card-head">
          <div className="card-title-wrap">
            <h2 className="card-title">Off-topic attempts</h2>
          </div>
        </header>
        <div className="card-body">
          <div className="sk-bar sk-bar-kpi" />
          <div className="sk-bar sk-bar-c" />
        </div>
      </section>
      <section className="card pulse">
        <header className="card-head">
          <div className="card-title-wrap">
            <h2 className="card-title">Coverage gaps</h2>
          </div>
        </header>
        <div className="card-body">
          {[0, 1, 2].map(i => <div key={i} className="sk-bar sk-bar-row" />)}
        </div>
      </section>
    </div>
  )
}

function InsightsReady({ data, generatedAt }: { data: InsightsPayload; generatedAt: number | null }) {
  const offTopicPct = Math.round((data.refusalRate ?? 0) * 100)
  const topics = [...data.topics].sort((a, b) => b.count - a.count)
  return (
    <>
      <section className="card">
        <header className="card-head">
          <div className="card-title-wrap">
            <h2 className="card-title">Topics</h2>
            <span className="card-meta">{data.topics.length} clusters · {data.totalConversations} conversations</span>
          </div>
          {generatedAt && (
            <span className="insights-stamp mono">generated {relTime(generatedAt)}</span>
          )}
        </header>
        <div className="card-body">
          <div className="topic-grid">
            {topics.map((t, i) => <TopicChip key={i} topic={t} />)}
          </div>
        </div>
      </section>

      <section className="card">
        <header className="card-head">
          <div className="card-title-wrap">
            <h2 className="card-title">Off-topic attempts</h2>
            <span className="card-meta">conversations the bot redirected</span>
          </div>
        </header>
        <div className="card-body">
          <div className="off-topic">
            <div className="off-topic-kpi">
              <div className="kpi-label">share of total</div>
              <div className="kpi-value">{offTopicPct}%</div>
            </div>
            <div className="off-topic-divider" />
            <div className="off-topic-meta">
              <div className="off-topic-line">
                <span className="mono">{data.refusalCount}</span> of{' '}
                <span className="mono">{data.totalConversations}</span> requests were off-topic and got refused.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <header className="card-head">
          <div className="card-title-wrap">
            <h2 className="card-title">Coverage gaps</h2>
            <span className="card-meta">questions the bot couldn't answer</span>
          </div>
        </header>
        <div className="card-body">
          {data.coverageGaps.length === 0 ? (
            <p className="empty-sub" style={{ marginTop: 0 }}>No coverage gaps detected.</p>
          ) : (
            <ul className="gap-list">
              {data.coverageGaps.map((q, i) => (
                <li key={i} className="gap-item">
                  <span className="gap-rule" />
                  <span className="gap-text">{q}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}

function InsightsError({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <div className="empty">
      <div className="empty-title">Analysis failed</div>
      <div className="empty-sub">Something went wrong generating insights.</div>
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={onRegenerate}>
        ↻ Try again
      </button>
    </div>
  )
}

export function InsightsTab() {
  const [status, setStatus] = useState<'generating' | 'ready' | 'error' | null>(null)
  const [data, setData] = useState<InsightsPayload | null>(null)
  const [generatedAt, setGeneratedAt] = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const fetchInsights = async () => {
    try {
      const res = await adminApi.getInsights()
      setStatus(res.status)
      setData(res.data)
      setGeneratedAt(res.generatedAt)
      if (res.status !== 'generating') stopPolling()
    } catch {
      setStatus('error')
      stopPolling()
    }
  }

  useEffect(() => {
    fetchInsights()
    return stopPolling
  }, [])

  useEffect(() => {
    if (status === 'generating' && !pollRef.current) {
      pollRef.current = setInterval(fetchInsights, 2000)
    } else if (status !== 'generating') {
      stopPolling()
    }
  }, [status])

  const handleRegenerate = async () => {
    stopPolling()
    setStatus('generating')
    setData(null)
    try {
      await adminApi.refreshInsights()
    } catch {
      // will retry via poll
    }
    pollRef.current = setInterval(fetchInsights, 2000)
  }

  const generating = status === 'generating' || status === null

  return (
    <main className="main">
      <div className="tab-bar">
        <div className="tab-bar-title">
          <h1 className="tab-bar-h">Insights</h1>
          <p className="tab-bar-sub">AI-generated analysis of recent visitor chats.</p>
        </div>
        <button
          className={`btn btn-ghost refresh${generating ? ' spin' : ''}`}
          onClick={handleRegenerate}
          disabled={generating}
          title="Regenerate insights"
        >
          <span className="ref-icon">↻</span> Regenerate
        </button>
      </div>

      {generating && <InsightsLoading />}
      {status === 'ready' && data && <InsightsReady data={data} generatedAt={generatedAt} />}
      {status === 'error' && <InsightsError onRegenerate={handleRegenerate} />}
    </main>
  )
}
