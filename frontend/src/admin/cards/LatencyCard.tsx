import type { LatencyStats } from '../adminApi'

interface LatencyCardProps {
  latency: LatencyStats[]
}

function fmtMs(ms: number): string {
  return ms >= 1000 ? (ms / 1000).toFixed(2) + 's' : ms + 'ms'
}

export function LatencyCard({ latency }: LatencyCardProps) {
  return (
    <section className="card">
      <header className="card-head">
        <div className="card-title-wrap">
          <h2 className="card-title">LLM Latency</h2>
          <span className="card-meta">p50 / p100 · slow = &gt;5s</span>
        </div>
      </header>
      <div className="card-body">
        {latency.length === 0 ? (
          <div style={{ color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            no data yet
          </div>
        ) : (
          <div className="tbl latency-tbl">
            <div className="tbl-head">
              <div className="col-event">event</div>
              <div className="col-num">avg</div>
              <div className="col-num">max</div>
              <div className="col-num">slow calls</div>
            </div>
            {latency.map((r) => (
              <div className="tbl-row" key={r.event_type}>
                <div className="col-event mono">{r.event_type}</div>
                <div className="col-num mono">{fmtMs(r.avg_latency_ms)}</div>
                <div className="col-num mono">{fmtMs(r.max_latency_ms)}</div>
                <div className="col-num mono">
                  <span className={r.slow_count > 20 ? 'warn' : ''}>{r.slow_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
