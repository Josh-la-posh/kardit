import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { TextField } from '@/components/ui/text-field'
import '@/styles/auth.css'

export default function LoginPage() {
  const { login } = useAuth()

  const [tenantId, setTenantId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const trimmedTenantId = tenantId.trim()
    if (!trimmedTenantId) {
      setError('Please enter your Tenant ID to continue.')
      return
    }

    setSubmitting(true)

    try {
      await login(trimmedTenantId)
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

              <div className="form-grid" style={{ gridTemplateColumns: '1fr', marginBottom: 24 }}>
                <TextField
                  id="s-tenant"
                  label="Tenant ID"
                  name="tenantId"
                  type="text"
                  required
                  placeholder="Enter your tenant ID"
                  autoComplete="organization"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  disabled={submitting}
                  size="lg"
                />
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
