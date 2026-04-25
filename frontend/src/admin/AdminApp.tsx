import { useState, useEffect } from 'react'
import { Login } from './Login'
import { Dashboard } from './Dashboard'
import { getStoredToken, adminApi } from './adminApi'
import './admin.css'

type View = 'loading' | 'login' | 'dashboard'

export function AdminApp() {
  const [view, setView] = useState<View>('loading')
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setView('login')
      return
    }
    // Validate stored token before showing dashboard
    adminApi.verifyToken(token).then((ok) => {
      setView(ok ? 'dashboard' : 'login')
    }).catch(() => setView('login'))
  }, [])

  const onLogin = () => {
    setTransitioning(true)
    setTimeout(() => {
      setView('dashboard')
      setTransitioning(false)
    }, 320)
  }

  if (view === 'loading') {
    return (
      <div className={`admin-root${transitioning ? ' transitioning' : ''}`}>
        <div className="admin-status">Checking auth…</div>
      </div>
    )
  }

  return (
    <div className={transitioning ? 'transitioning' : ''}>
      {view === 'login' ? <Login onSuccess={onLogin} /> : <Dashboard />}
    </div>
  )
}
