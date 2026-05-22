import { useState } from 'react'
import { Swoosh } from '@/components/marketting/Swoosh'
import { TrustStrip } from '@/components/marketting/TrustStrip'

export default function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      <section className="subhero" data-swoosh>
        <Swoosh variant="subtle" />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="eyebrow">Contact</span>
          <h1 className="subhero__title">Let's Talk.</h1>
          <p className="subhero__lede">We are always here for you to answer any question you may have. Tell us about your business and a consultant will be in touch within one working day.</p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="grid-2 reveal" style={{ gap: 64, alignItems: 'start' }}>
            <form
              className="card"
              style={{ padding: 40, borderRadius: 20, boxShadow: 'var(--cs-shadow-md)', gap: 0 }}
              onSubmit={handleSubmit}
            >
              <div className="eyebrow eyebrow--muted">Tell us about your business</div>
              <h2 className="section-head__title" style={{ margin: '8px 0 28px', fontSize: 28 }}>
                A consultant will reply within one working day.
              </h2>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="f-fname">First name</label>
                  <input id="f-fname" type="text" required placeholder="Adaeze" autoComplete="given-name" />
                </div>
                <div className="field">
                  <label htmlFor="f-lname">Last name</label>
                  <input id="f-lname" type="text" required placeholder="Okafor" autoComplete="family-name" />
                </div>
                <div className="field">
                  <label htmlFor="f-email">Work email</label>
                  <input id="f-email" type="email" required placeholder="adaeze@example.com" autoComplete="email" />
                </div>
                <div className="field">
                  <label htmlFor="f-phone">Phone</label>
                  <input id="f-phone" type="tel" placeholder="+234 803 000 0000" autoComplete="tel" />
                </div>
                <div className="field field--full">
                  <label htmlFor="f-company">Company</label>
                  <input id="f-company" type="text" required placeholder="Acme Bank" autoComplete="organization" />
                </div>
                <div className="field">
                  <label htmlFor="f-industry">Industry</label>
                  <select id="f-industry" required defaultValue="">
                    <option value="">Select an industry…</option>
                    <option>Financial Institution / Bank</option>
                    <option>Payment Service Provider</option>
                    <option>Fintech</option>
                    <option>Government / Public Sector</option>
                    <option>Education</option>
                    <option>Healthcare</option>
                    <option>Retail / Merchant</option>
                    <option>Telecoms</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="f-product">Interested in</label>
                  <select id="f-product" required defaultValue="">
                    <option value="">Select a product…</option>
                    <option>ChamsPay (gateway)</option>
                    <option>Naira.com (e-commerce)</option>
                    <option>Naira Plus (corporate)</option>
                    <option>MX Suite (vertical)</option>
                    <option>Switching & Processing</option>
                    <option>Custom Solution</option>
                  </select>
                </div>
                <div className="field field--full">
                  <label htmlFor="f-msg">Tell us a bit more</label>
                  <textarea id="f-msg" placeholder="What channels do you support today? What's the volume? Anything we should know going in?"></textarea>
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="submit" className="btn btn--accent" disabled={sent}>
                  {sent ? 'Sent ✓' : 'Send message'}
                </button>
                <span className="cs-small">Or call us at <strong style={{ color: 'var(--cs-ink-700)' }}>+234-803-394-4566</strong></span>
              </div>
              <div
                className="form-success"
                style={{
                  display: sent ? 'block' : 'none',
                  marginTop: 20,
                  background: 'var(--cs-green-100)',
                  border: '1px solid var(--cs-green-300)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  color: 'var(--cs-green-900)',
                  fontSize: 14,
                }}
              >
                Thanks — we received your note. A consultant will be in touch within one working day.
              </div>
            </form>

            <aside style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div>
                <span className="eyebrow">Visit us</span>
                <h3 className="cs-h3" style={{ marginTop: 8, fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 22, color: 'var(--cs-ink-700)' }}>Lagos · Headquarters</h3>
                <p className="cs-p" style={{ marginTop: 8 }}>8, Louis Solomon Close,<br />Off Ahmadu Bello Way,<br />Victoria Island, Lagos.</p>
                <div className="cs-small" style={{ marginTop: 12 }}>Mon – Fri · 08:00 – 18:00 WAT</div>
              </div>
              <div>
                <span className="eyebrow">Abuja office</span>
                <h3 className="cs-h3" style={{ marginTop: 8, fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 22, color: 'var(--cs-ink-700)' }}>Abuja · Public sector desk</h3>
                <p className="cs-p" style={{ marginTop: 8 }}>Plot 273, Cadastral Zone B02,<br />Mabushi District, Abuja.</p>
                <div className="cs-small" style={{ marginTop: 12 }}>Mon – Fri · 09:00 – 17:00 WAT</div>
              </div>
              <div>
                <span className="eyebrow">Direct lines</span>
                <ul className="dotted-list" style={{ marginTop: 12 }}>
                  <li>Sales · <span style={{ fontFamily: 'var(--cs-font-mono)' }}>+234-803-394-4566</span></li>
                  <li>Support · <span style={{ fontFamily: 'var(--cs-font-mono)' }}>+234-700-KARDIT</span></li>
                  <li>Press · <span style={{ fontFamily: 'var(--cs-font-mono)' }}>press@kardit.com</span></li>
                  <li>Partnerships · <span style={{ fontFamily: 'var(--cs-font-mono)' }}>partners@kardit.com</span></li>
                </ul>
              </div>
              <div style={{ background: 'var(--cs-mist)', border: '1px solid var(--cs-line)', borderRadius: 16, padding: 24 }}>
                <span className="eyebrow">Existing customer?</span>
                <h4 className="cs-h4" style={{ marginTop: 8, fontFamily: 'var(--cs-font-display)', fontWeight: 700, fontSize: 18 }}>Reach support directly.</h4>
                <p className="cs-p" style={{ marginTop: 8, fontSize: 14 }}>Production issues are routed to on-call within minutes — 24/7.</p>
                <a className="btn-arrow" href="#" style={{ marginTop: 14 }}>Open a ticket</a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <TrustStrip />
    </>
  )
}
