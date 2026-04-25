import { useMemo } from 'react'
import { Sparkline, SparkPoint } from '../Sparkline'
import type { DailySessions } from '../adminApi'

interface ActivityCardProps {
  days: DailySessions[]
  timeWindow: '7d' | '30d'
}

const fmt = (n: number) => n.toLocaleString('en-US')

function shortLabel(day: string): string {
  const d = new Date(day + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ActivityCard({ days, timeWindow }: ActivityCardProps) {
  const totals = useMemo(
    () => days.reduce((a, d) => ({ sessions: a.sessions + d.sessions }), { sessions: 0 }),
    [days]
  )

  const avgPerDay = days.length > 0 ? Math.round(totals.sessions / days.length) : 0

  const sparkPoints: SparkPoint[] = days.map((d) => ({
    label: shortLabel(d.day),
    value: d.sessions,
    tip: { sessions: d.sessions },
  }))

  return (
    <section className="card">
      <header className="card-head">
        <div className="card-title-wrap">
          <h2 className="card-title">Activity</h2>
          <span className="card-meta">last {timeWindow === '7d' ? 7 : 30} days</span>
        </div>
      </header>
      <div className="card-body">
        <div className="kpi-row">
          <div className="kpi">
            <div className="kpi-label">sessions</div>
            <div className="kpi-value mono">{fmt(totals.sessions)}</div>
          </div>
          <div className="kpi-divider" />
          <div className="kpi">
            <div className="kpi-label">avg / day</div>
            <div className="kpi-value mono">{fmt(avgPerDay)}</div>
          </div>
        </div>
        <Sparkline points={sparkPoints} gradId="activityfill" />
      </div>
    </section>
  )
}
