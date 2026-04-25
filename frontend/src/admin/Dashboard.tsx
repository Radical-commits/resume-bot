import { useState, useEffect, useCallback } from 'react'
import { adminApi } from './adminApi'
import type { AdminSummary, DbStatus } from './adminApi'
import { ActivityCard } from './cards/ActivityCard'
import { TokenUsageCard } from './cards/TokenUsageCard'
import { LatencyCard } from './cards/LatencyCard'
import { DatabaseCard } from './cards/DatabaseCard'

type TimeWindow = '7d' | '30d'

const LAST_REFRESHED_LABELS = ['just now', '1m ago', '2m ago', '4m ago', '7m ago']

function useLastRefreshed(tick: number) {
  const [label, setLabel] = useState('just now')
  useEffect(() => {
    setLabel('just now')
    let i = 0
    const id = setInterval(() => {
      i = Math.min(i + 1, LAST_REFRESHED_LABELS.length - 1)
      setLabel(LAST_REFRESHED_LABELS[i])
    }, 18000)
    return () => clearInterval(id)
  }, [tick])
  return label
}

export function Dashboard() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('7d')
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [tick, setTick] = useState(0)
  const lastRefreshed = useLastRefreshed(tick)

  const fetchData = useCallback(async () => {
    try {
      const [s, db] = await Promise.all([adminApi.getSummary(), adminApi.getDbStatus()])
      setSummary(s)
      setDbStatus(db)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchData().finally(() => setLoading(false))
  }, [fetchData])

  const onRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    setTick((t) => t + 1)
  }

  const onPruned = useCallback(() => {
    // Refresh db status after prune
    adminApi.getDbStatus().then(setDbStatus).catch(() => {})
  }, [])

  const windowDays = timeWindow === '7d' ? 7 : 30

  const sessionDays = summary
    ? summary.sessionsPerDay.slice(-windowDays)
    : []

  const tokenDays = summary
    ? summary.dailyTokens.slice(-windowDays)
    : []

  return (
    <div className="admin-root">
      {/* Header */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-dot" />
            <span className="brand-name">resume-bot</span>
            <span className="brand-sep">/</span>
            <span className="brand-section">admin</span>
          </div>
          <div className="top-actions">
            <span className="last-ref mono">{lastRefreshed}</span>
            <div className="seg">
              <button
                className={`seg-btn${timeWindow === '7d' ? ' on' : ''}`}
                onClick={() => setTimeWindow('7d')}
              >7d</button>
              <button
                className={`seg-btn${timeWindow === '30d' ? ' on' : ''}`}
                onClick={() => setTimeWindow('30d')}
              >30d</button>
            </div>
            <button
              className={`btn btn-ghost refresh${refreshing ? ' spin' : ''}`}
              onClick={onRefresh}
              disabled={refreshing}
            >
              <span className="ref-icon">↻</span> Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div className="admin-status">Loading…</div>
      ) : error ? (
        <div className="admin-status error">{error}</div>
      ) : summary && dbStatus ? (
        <main className="admin-main">
          <ActivityCard days={sessionDays} timeWindow={timeWindow} />
          <TokenUsageCard days={tokenDays} modelUsage={summary.modelUsage} timeWindow={timeWindow} />
          <LatencyCard latency={summary.latency} />
          <DatabaseCard status={dbStatus} onPruned={onPruned} />
          <footer className="admin-foot mono">resume-bot admin</footer>
        </main>
      ) : null}
    </div>
  )
}
