import type { AdminSummary, DbStatus } from './adminApi'
import { ActivityCard } from './cards/ActivityCard'
import { TokenUsageCard } from './cards/TokenUsageCard'
import { LatencyCard } from './cards/LatencyCard'
import { DatabaseCard } from './cards/DatabaseCard'

interface DashboardProps {
  timeWindow: '7d' | '30d'
  summary: AdminSummary | null
  dbStatus: DbStatus | null
  loading: boolean
  error: string | null
  onPruned: () => void
}

export function Dashboard({ timeWindow, summary, dbStatus, loading, error, onPruned }: DashboardProps) {
  const windowDays = timeWindow === '7d' ? 7 : 30
  const sessionDays = summary ? summary.sessionsPerDay.slice(-windowDays) : []
  const tokenDays = summary ? summary.dailyTokens.slice(-windowDays) : []

  if (loading) return <div className="admin-status">Loading…</div>
  if (error) return <div className="admin-status error">{error}</div>
  if (!summary || !dbStatus) return null

  return (
    <main className="admin-main">
      <ActivityCard days={sessionDays} timeWindow={timeWindow} />
      <TokenUsageCard days={tokenDays} modelUsage={summary.modelUsage} timeWindow={timeWindow} />
      <LatencyCard latency={summary.latency} />
      <DatabaseCard status={dbStatus} onPruned={onPruned} />
      <footer className="admin-foot mono">resume-bot admin</footer>
    </main>
  )
}
