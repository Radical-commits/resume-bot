import { useState } from 'react'
import { adminApi } from '../adminApi'
import type { DbStatus } from '../adminApi'

interface DatabaseCardProps {
  status: DbStatus
  onPruned: (deleted: number) => void
}

const fmt = (n: number) => n.toLocaleString('en-US')

export function DatabaseCard({ status, onPruned }: DatabaseCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [pruning, setPruning] = useState(false)
  const [lastDeleted, setLastDeleted] = useState<number | null>(null)

  const doPrune = async () => {
    setPruning(true)
    try {
      const { deleted } = await adminApi.pruneDatabase()
      setLastDeleted(deleted)
      setConfirming(false)
      onPruned(deleted)
      setTimeout(() => setLastDeleted(null), 3000)
    } catch {
      setConfirming(false)
    } finally {
      setPruning(false)
    }
  }

  return (
    <section className="card">
      <header className="card-head">
        <div className="card-title-wrap">
          <h2 className="card-title">Database</h2>
          <span className="card-meta">sqlite · analytics.db</span>
        </div>
        {!confirming && (
          <button className="btn btn-ghost" onClick={() => setConfirming(true)}>
            Prune (90d)
          </button>
        )}
      </header>
      <div className="card-body">
        <div className="db-stats">
          <div className="db-row">
            <div className="db-label">DB file size</div>
            <div className="db-val mono">{status.sizeMB} <span className="db-unit">MB</span></div>
          </div>
          <div className="db-row">
            <div className="db-label">analytics_events</div>
            <div className="db-val mono">{fmt(status.analyticsEvents)} <span className="db-unit">rows</span></div>
          </div>
          <div className="db-row">
            <div className="db-label">ai_audit_log</div>
            <div className="db-val mono">{fmt(status.aiAuditLog)} <span className="db-unit">rows</span></div>
          </div>
        </div>

        {confirming && (
          <div className="confirm">
            <div className="confirm-msg">
              Delete <span className="mono">{fmt(status.prunable)}</span> rows older than 90 days?
            </div>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={pruning}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={doPrune} disabled={pruning}>
                {pruning ? 'Pruning…' : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {lastDeleted !== null && (
          <div className="confirm confirm-ok">
            <div className="confirm-msg">
              <span className="ok-dot" />
              Pruned <span className="mono">{fmt(lastDeleted)}</span> rows.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
