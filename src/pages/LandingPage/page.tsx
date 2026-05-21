import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Swoosh } from '@/components/marketting/Swoosh'
import { TrustStrip } from '@/components/marketting/TrustStrip'
import HowItWorks from './components/HowItWorks'

export default function Page() {
  return (
    <main>
      <section className="hero" data-swoosh>
        <Swoosh variant="default" />
        <div className="container hero__inner">
          <div>
            <span className="pill"><span className="dot" /> Now licensed for UnionPay cross-border</span>
            <h1 className="hero__title">
              <span className="hero__title-line">Convenient.</span>
              <span className="hero__title-line">Simple.</span>
              <span className="hero__title-line"><em>Secure.</em></span>
            </h1>
            <p className="hero__lede">
              A multichannel electronic payments switch built for issuers, acquirers, fintechs and
              the merchants they serve. Connect every channel — ATM, POS, web, mobile, USSD — to
              one platform.
            </p>
            <div className="hero__cta">
              <Link className="btn btn--primary" to="/onboarding/start">Start enrollment</Link>
              <Link className="btn btn--ghost" to="/login">Sign in →</Link>
            </div>
            <div className="hero__trust">Trusted by 200,000+ businesses · PCI-DSS · ISO 27001</div>
          </div>

          <div className="hero__card" data-parallax="hero-card" aria-label="Live transaction volume snapshot">
            <div className="hero__card-header">
              <div>
                <div className="hero__card-label">Today · Volume</div>
                <div className="hero__card-amount">₦4,820,140</div>
              </div>
              <span className="hero__card-delta">▲ 12.4%</span>
            </div>
            <div className="hero__card-bars" aria-hidden="true">
              {[30, 55, 42, 75, 60, 88, 72, 95, 68].map((h, i) => (
                <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }} />
              ))}
              {[80, 92, 100].map((h, i) => (
                <span key={`r${i}`} className="is-recent" style={{ height: `${h}%`, animationDelay: `${(i + 9) * 40}ms` }} />
              ))}
            </div>
            <div className="hero__card-stats">
              <div><div className="label">Settled</div><div className="value">94.2%</div></div>
              <div><div className="label">Pending</div><div className="value">4.1%</div></div>
              <div><div className="label">Declined</div><div className="value">1.7%</div></div>
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />

      <section className="section section--paper">
        <div className="container">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Products & Solutions</div>
              <h2 className="section-head__title">One switch. Every channel.</h2>
            </div>
            <p className="section-head__lede">
              From a single API to vertical-specific suites, the Kardit platform meets you where
              your business is.
            </p>
          </div>

          <div className="grid-3">
            <ProductCard delay={1} icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            } eyebrow="Payment Gateway" name="ChamsPay"
               desc="Accept card, bank transfer, USSD and QR online — settled to your account next day."
               href="/solutions#chamspay" />
            <ProductCard delay={2} icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 7 1-4h18l1 4" /><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
              </svg>
            } eyebrow="E-Commerce & Bills" name="Naira.com"
               desc="PCI-DSS-secured platform for everyday bill payments, transfers and airtime — for consumers and merchants."
               href="/solutions#naira" />
            <ProductCard delay={3} icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            } eyebrow="Vertical Suites" name="MX Suite"
               desc="Pre-built switching for Campus, Health, E-Gov, Move and Enterprise — with custom configurations."
               href="/solutions#mx" />
          </div>
        </div>
      </section>

      <section className="section section--tight section--white">
        <div className="container reveal">
          <div className="eyebrow">Industries we serve</div>
          <div className="chips" style={{ marginTop: 16 }}>
            <Link className="chip" to="/industries#financial">Financial Institutions</Link>
            <Link className="chip" to="/industries#transport">Public Transport</Link>
            <Link className="chip" to="/industries#government">Government</Link>
            <Link className="chip" to="/industries#education">Education</Link>
            <Link className="chip" to="/industries#health">Healthcare</Link>
            <Link className="chip" to="/industries#retail">Retail</Link>
            <Link className="chip" to="/industries#telecoms">Telecoms</Link>
            <Link className="chip" to="/industries#hr">HR & Payroll</Link>
          </div>
        </div>
      </section>

      <section className="section section--ink" data-swoosh>
        <Swoosh variant="ink" />
        <div className="container">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow eyebrow--inverse">By the numbers</div>
              <h2 className="section-head__title">A platform with proof.</h2>
            </div>
          </div>
          <div className="stats-grid">
            <div className="reveal" data-delay="1">
              <div className="stat__num" data-count="200000" data-suffix="+" data-format="compact">0</div>
              <div className="stat__lab">businesses on the platform</div>
            </div>
            <div className="reveal" data-delay="2">
              <div className="stat__num" data-count="6" data-suffix="+">0</div>
              <div className="stat__lab">global card schemes connected</div>
            </div>
            <div className="reveal" data-delay="3">
              <div className="stat__num" data-count="16" data-suffix="+">0</div>
              <div className="stat__lab">years of payments experience</div>
            </div>
            <div className="reveal" data-delay="4">
              <div className="stat__num">24/7</div>
              <div className="stat__lab">real-time monitoring & support</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container reveal">
          <div className="pullquote">
            We empower issuers, acquirers, fintechs and the merchants they serve with smarter,
            simpler payments solutions — connecting every channel to a single, secure switch.
            <span className="pullquote__attr">— Convenient, simple and secure. Always.</span>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container reveal">
          <div className="cta-band">
            <div>
              <h2 className="cta-band__title">Let's Talk.</h2>
              <p className="cta-band__lede">
                We are always here for you to answer any question you may have. Tell us about your
                business and a consultant will be in touch within one working day.
              </p>
            </div>
            <div className="cta-band__actions">
              <Link className="btn btn--accent" to="/onboarding/start">Start enrollment</Link>
              <Link className="btn btn--outline-green" to="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
    </main>
  )
}

function ProductCard({ delay, icon, eyebrow, name, desc, href }: {
  delay: number
  icon: ReactNode
  eyebrow: string
  name: string
  desc: string
  href: string
}) {
  return (
    <article className="card reveal" data-delay={delay}>
      <div className="card__icon">{icon}</div>
      <div className="eyebrow eyebrow--muted">{eyebrow}</div>
      <div className="card__name">{name}</div>
      <p className="card__desc">{desc}</p>
      <Link className="btn-arrow" to={href}>Learn more</Link>
    </article>
  )
}
