import { useState, useEffect, useCallback } from 'react'
import { Login } from './Login'
import { Dashboard } from './Dashboard'
import { InsightsTab } from './tabs/InsightsTab'
import { VisitorQuestionsTab } from './tabs/VisitorQuestionsTab'
import { getStoredToken, adminApi } from './adminApi'
import type { AdminSummary, DbStatus } from './adminApi'
import './admin.css'

type AppView = 'loading' | 'login' | 'app'
type Tab = 'dashboard' | 'insights' | 'questions'
type TimeWindow = '7d' | '30d'

const LAST_REFRESHED_LABELS = ['just now', '1m ago', '2m ago', '4m ago', '7m ago']

const TAB_ICONS: Record<Tab, JSX.Element> = {
  dashboard: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="4.5" height="6" rx="1" />
      <rect x="8" y="1.5" width="4.5" height="3.5" rx="1" />
      <rect x="1.5" y="9" width="4.5" height="3.5" rx="1" />
      <rect x="8" y="6.5" width="4.5" height="6" rx="1" />
    </svg>
  ),
  insights: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 11 L5 7 L7.5 9 L12 3.5" />
      <path d="M9 3.5 L12 3.5 L12 6.5" />
    </svg>
  ),
  questions: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5 H12 V9 H7 L4.5 11 V9 H2 Z" />
    </svg>
  ),
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'insights', label: 'Insights' },
  { id: 'questions', label: 'Visitor Questions' },
]

export function AdminApp() {
  const [view, setView] = useState<AppView>('loading')
  const [transitioning, setTransitioning] = useState(false)
  const [tab, setTab] = useState<Tab>('dashboard')

  // Dashboard-specific state lifted here so topbar controls work
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('7d')
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null)
  const [dashLoading, setDashLoading] = useState(true)
  const [dashError, setDashError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [tick, setTick] = useState(0)
  const [lastRefreshed, setLastRefreshed] = useState('just now')

  useEffect(() => {
    const token = getStoredToken()
    if (!token) { setView('login'); return }
    adminApi.verifyToken(token)
      .then(ok => setView(ok ? 'app' : 'login'))
      .catch(() => setView('login'))
  }, [])

  // Age the "last refreshed" label
  useEffect(() => {
    if (view !== 'app') return
    setLastRefreshed('just now')
    let i = 0
    const id = setInterval(() => {
      i = Math.min(i + 1, LAST_REFRESHED_LABELS.length - 1)
      setLastRefreshed(LAST_REFRESHED_LABELS[i])
    }, 18000)
    return () => clearInterval(id)
  }, [tick, view])

  const fetchDashboard = useCallback(async () => {
    try {
      const [s, db] = await Promise.all([adminApi.getSummary(), adminApi.getDbStatus()])
      setSummary(s)
      setDbStatus(db)
      setDashError(null)
    } catch (e) {
      setDashError(e instanceof Error ? e.message : 'Failed to load data')
    }
  }, [])

  useEffect(() => {
    if (view !== 'app') return
    setDashLoading(true)
    fetchDashboard().finally(() => setDashLoading(false))
  }, [view, fetchDashboard])

  const onRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    await fetchDashboard()
    setRefreshing(false)
    setTick(t => t + 1)
  }

  const onPruned = useCallback(() => {
    adminApi.getDbStatus().then(setDbStatus).catch(() => {})
  }, [])

  const onLogin = () => {
    setTransitioning(true)
    setTimeout(() => { setView('app'); setTransitioning(false) }, 320)
  }

  if (view === 'loading') {
    return <div className="admin-root"><div className="admin-status">Checking auth…</div></div>
  }

  if (view === 'login') {
    return (
      <div className={transitioning ? 'transitioning' : ''}>
        <Login onSuccess={onLogin} />
      </div>
    )
  }

  return (
    <div className={`admin-root${transitioning ? ' transitioning' : ''}`}>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-row">
            <div className="brand">
              <span className="brand-dot" />
              <span className="brand-name">resume-bot</span>
              <span className="brand-sep">/</span>
              <span className="brand-section">admin</span>
            </div>
            {tab === 'dashboard' && (
              <div className="top-actions">
                <span className="last-ref mono">{lastRefreshed}</span>
                <div className="seg">
                  <button className={`seg-btn${timeWindow === '7d' ? ' on' : ''}`} onClick={() => setTimeWindow('7d')}>7d</button>
                  <button className={`seg-btn${timeWindow === '30d' ? ' on' : ''}`} onClick={() => setTimeWindow('30d')}>30d</button>
                </div>
                <button className={`btn btn-ghost refresh${refreshing ? ' spin' : ''}`} onClick={onRefresh} disabled={refreshing}>
                  <span className="ref-icon">↻</span> Refresh
                </button>
              </div>
            )}
          </div>
          <nav className="tabs" role="tablist">
            {TABS.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`tab${tab === t.id ? ' on' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span className="tab-glyph">{TAB_ICONS[t.id]}</span>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {tab === 'dashboard' && (
        <Dashboard
          timeWindow={timeWindow}
          summary={summary}
          dbStatus={dbStatus}
          loading={dashLoading}
          error={dashError}
          onPruned={onPruned}
        />
      )}
      {tab === 'insights' && <InsightsTab />}
      {tab === 'questions' && <VisitorQuestionsTab />}
    </div>
  )
}
