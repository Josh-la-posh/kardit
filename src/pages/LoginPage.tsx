import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import '@/styles/auth.css'
import { TextField } from '@/components/ui/text-field'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setSubmitting(true)

    try {
      const result = await login({
        username: email,
        password,
        channel: 'WEB',
        deviceInfo: {
          userAgent: navigator.userAgent,
          deviceFingerprint: 'frontend-mock',
        },
      })

      if (!result.success) {
        setError(result.error || 'Login failed')
        return
      }

      navigate('/dashboard')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const submitText = submitting ? 'Signing in...' : 'Sign in'

  return (
    <main className="">
      <section className="section section--centered">
        <div className="container">
          <div className="signin-wrap reveal">
            <form className="signin-card" onSubmit={onSubmit} noValidate>
              <div className="eyebrow eyebrow--muted">Already enrolled? Log in below.</div>
              <h2 className="section-head__title" style={{ margin: '8px 0 24px', fontSize: 24 }}>
                Sign in to your account
              </h2>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="field field--full">
                  <label htmlFor="s-email">Work email</label>
                  <input
                    id="s-email"
                    name="email"
                    type="email"
                    required
                    placeholder="adaeze@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="field field--full">
                  <label htmlFor="s-pwd">Password</label>
                  <div className="pwd-wrap">
                    <input
                      id="s-pwd"
                      name="password"
                      type={showPwd ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      className="pwd-toggle"
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPwd((s) => !s)}
                    >
                      {showPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="signin-row">
                <label className="remember">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>
                <Link className="forgot" to="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn btn--accent signin-submit" disabled={submitting}>
                {submitText}
              </button>

              {error && (
                <div className="signin-error is-visible" role="alert" aria-live="polite">
                  {error}
                </div>
              )}
            </form>

            <div className="signin-divider">New to Kardit?</div>

            <div className="enroll-card">
              <span className="eyebrow">Become an affiliate</span>
              <h4>Don't have an account yet?</h4>
              <p>
                Walk through our 9-step affiliate onboarding to register your business, submit
                compliance documents and go live on the Kardit switch — typically reviewed within
                two working days.
              </p>
              <Link className="btn btn--outline-green" to="/onboarding/start" style={{ display: 'inline-flex' }}>
                Start enrollment{' '}
                <span style={{ marginLeft: 8 }} aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
