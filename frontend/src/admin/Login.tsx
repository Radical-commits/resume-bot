import { useState, useEffect, useRef } from 'react'
import { adminApi, storeToken } from './adminApi'

interface LoginProps {
  onSuccess: () => void
}

export function Login({ onSuccess }: LoginProps) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState('')
  const [shake, setShake] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const triggerShake = (message: string) => {
    setErr(message)
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!val.trim()) {
      triggerShake('Admin token required.')
      return
    }
    setSubmitting(true)
    try {
      const ok = await adminApi.verifyToken(val.trim())
      if (ok) {
        storeToken(val.trim())
        setErr('')
        onSuccess()
      } else {
        triggerShake('Invalid token. Access denied.')
      }
    } catch {
      triggerShake('Connection error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <form className={`login-card${shake ? ' shake' : ''}`} onSubmit={submit}>
        <div className="login-eyebrow">resume-bot</div>
        <h1 className="login-title">admin</h1>
        <p className="login-path">/admin/login</p>

        <label className="login-label" htmlFor="token">Admin token</label>
        <input
          ref={inputRef}
          id="token"
          type="password"
          className="login-input"
          value={val}
          onChange={(e) => { setVal(e.target.value); if (err) setErr('') }}
          autoComplete="off"
          spellCheck={false}
          disabled={submitting}
        />

        <button type="submit" className="login-submit" disabled={submitting}>
          {submitting ? 'Verifying…' : 'Submit'}
        </button>

        <div className="login-error" style={{ visibility: err ? 'visible' : 'hidden' }}>
          {err || 'placeholder'}
        </div>
      </form>
    </div>
  )
}
