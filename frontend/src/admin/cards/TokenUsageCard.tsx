import { useMemo } from 'react'
import { Sparkline, SparkPoint } from '../Sparkline'
import type { DailyTokens, ModelUsage } from '../adminApi'

interface TokenUsageCardProps {
  days: DailyTokens[]
  modelUsage: ModelUsage[]
  timeWindow: '7d' | '30d'
}

const PROVIDER_STYLES: Record<string, { bg: string; fg: string; bd: string }> = {
  groq:   { bg: 'rgba(234, 88, 12, 0.14)',  fg: '#fb923c', bd: 'rgba(234, 88, 12, 0.35)' },
  openai: { bg: 'rgba(16, 163, 127, 0.14)', fg: '#34d399', bd: 'rgba(16, 163, 127, 0.35)' },
  google: { bg: 'rgba(59, 130, 246, 0.14)', fg: '#60a5fa', bd: 'rgba(59, 130, 246, 0.35)' },
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function shortLabel(day: string): string {
  const d = new Date(day + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ProviderChip({ name }: { name: string }) {
  const s = PROVIDER_STYLES[name] ?? PROVIDER_STYLES.groq
  return (
    <span className="chip" style={{ background: s.bg, color: s.fg, borderColor: s.bd }}>
      {name}
    </span>
  )
}

export function TokenUsageCard({ days, modelUsage, timeWindow }: TokenUsageCardProps) {
  const totals = useMemo(
    () =>
      days.reduce(
        (a, d) => ({
          tokensIn: a.tokensIn + (d.tokens_in ?? 0),
          tokensOut: a.tokensOut + (d.tokens_out ?? 0),
        }),
        { tokensIn: 0, tokensOut: 0 }
      ),
    [days]
  )

  const sparkPoints: SparkPoint[] = days.map((d) => ({
    label: shortLabel(d.day),
    value: d.total_tokens ?? 0,
    tip: {
      in: fmtTokens(d.tokens_in ?? 0),
      out: fmtTokens(d.tokens_out ?? 0),
    },
  }))

  const topModel = modelUsage[0]

  const totalSummary = (
    <div className="card-summary">
      <span className="card-summary-label">total</span>
      <span className="card-summary-value mono">
        {fmtTokens(totals.tokensIn + totals.tokensOut)}
      </span>
    </div>
  )

  return (
    <section className="card">
      <header className="card-head">
        <div className="card-title-wrap">
          <h2 className="card-title">Token Usage</h2>
          <span className="card-meta">last {timeWindow === '7d' ? 7 : 30} days</span>
        </div>
        {totalSummary}
      </header>
      <div className="card-body">
        <div className="kpi-row">
          <div className="kpi">
            <div className="kpi-label">tokens in</div>
            <div className="kpi-value mono">{fmtTokens(totals.tokensIn)}</div>
          </div>
          <div className="kpi-divider" />
          <div className="kpi">
            <div className="kpi-label">tokens out</div>
            <div className="kpi-value mono">{fmtTokens(totals.tokensOut)}</div>
          </div>
          {topModel && (
            <>
              <div className="kpi-divider" />
              <div className="kpi kpi-model">
                <div className="kpi-label">model</div>
                <div className="kpi-meta-row">
                  <ProviderChip name={topModel.provider} />
                  <span className="mono kpi-model-name">{topModel.model}</span>
                </div>
              </div>
            </>
          )}
        </div>
        <Sparkline
          points={sparkPoints}
          color="var(--accent)"
          gradId="tokenfill"
        />
      </div>
    </section>
  )
}
