import { Swoosh } from '@/components/marketting/Swoosh';
import { Link } from 'react-router-dom'

export default function Solutions() {
  return (
    <>
      <section className="subhero" data-swoosh>
        <Swoosh variant="subtle" />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="eyebrow">Solutions</span>
          <h1 className="subhero__title">One platform for every payment, every channel.</h1>
          <p className="subhero__lede">
            From a single API to vertical-specific suites, Kardit delivers the rails for issuers,
            acquirers, fintechs and the merchants they serve. Switching, processing, hosted
            services and bespoke configurations — all on the same platform.
          </p>
        </div>
      </section>

      <section className="section section--white" id="chamspay">
        <div className="container">
          <div className="grid-2 reveal" style={{ gap: 64, alignItems: 'center' }}>
            <div>
              <span className="eyebrow">Payment Gateway</span>
              <h2 className="section-head__title" style={{ marginTop: 8 }}>ChamsPay</h2>
              <p className="card__desc" style={{ fontSize: 17, marginTop: 16 }}>
                Accept card, bank transfer, USSD and QR online — settled to your account next day.
                PCI-DSS-secured rails, with built-in chargeback management and real-time fraud
                screening.
              </p>
              <ul className="dotted-list" style={{ marginTop: 24 }}>
                <li>Single API for card, transfer, USSD and QR — one integration, every channel.</li>
                <li>Next-day settlement to any Nigerian bank account.</li>
                <li>Real-time fraud screening, chargeback workflow and dispute portal.</li>
                <li>Multi-currency acquiring (NGN, USD, GBP, EUR) with cross-border via UnionPay.</li>
              </ul>
              <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link className="btn btn--primary" to="/contact">Get integrated</Link>
                <a className="btn btn--ghost" href="#switching">Read the docs →</a>
              </div>
            </div>
            <div className="card" style={{ padding: 32, borderRadius: 20, boxShadow: 'var(--cs-shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="eyebrow eyebrow--muted">Acceptance rate · 30d</div>
                  <div className="hero__card-amount" style={{ fontSize: 36, marginTop: 4 }}>98.7%</div>
                </div>
                <span className="hero__card-delta">▲ 0.4 pts</span>
              </div>
              <div className="hero__card-bars" style={{ marginTop: 24 }}>
                {[62, 78, 55, 84, 72, 91, 80].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
                {[88, 95, 100].map((h, i) => (
                  <span key={`r${i}`} className="is-recent" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="hero__card-stats" style={{ marginTop: 20 }}>
                <div><div className="label">Card</div><div className="value">61.2%</div></div>
                <div><div className="label">Transfer</div><div className="value">29.8%</div></div>
                <div><div className="label">USSD/QR</div><div className="value">9.0%</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--paper" id="naira">
        <div className="container">
          <div className="grid-2 reveal" style={{ gap: 64, alignItems: 'center' }}>
            <div className="card" style={{ padding: 32, borderRadius: 20, boxShadow: 'var(--cs-shadow-md)', order: 1 }}>
              <div className="eyebrow eyebrow--muted">Bill payments</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                <BillTile name="DSTV · Premium" amount="₦24,500.00" />
                <BillTile name="EKEDC · Prepaid" amount="₦5,000.00" />
                <BillTile name="MTN · Airtime" amount="₦2,000.00" />
                <BillTile name="LASWA · Levy" amount="₦8,750.00" />
              </div>
              <button className="btn btn--primary" style={{ width: '100%', marginTop: 16 }}>Pay all bills</button>
            </div>
            <div style={{ order: 2 }}>
              <span className="eyebrow">E-Commerce & Bills</span>
              <h2 className="section-head__title" style={{ marginTop: 8 }}>Naira.com</h2>
              <p className="card__desc" style={{ fontSize: 17, marginTop: 16 }}>
                Our flagship platform for everyday payments. Bill settlement, transfers, airtime,
                virtual accounts — PCI-DSS-secured and OWASP-certified, available to consumers and
                to merchants who embed it.
              </p>
              <ul className="dotted-list" style={{ marginTop: 24 }}>
                <li>Pay any utility, telco or government bill in Nigeria — one wallet.</li>
                <li>Embeddable for partner merchants via white-label SDK.</li>
                <li>Virtual accounts and bank-grade ledgering.</li>
                <li>Naira Plus add-on for corporate collections and bulk payments.</li>
              </ul>
              <div style={{ marginTop: 28 }}>
                <Link className="btn btn--outline-green" to="/contact">Become a Naira partner</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--white" id="mx">
        <div className="container">
          <div className="reveal">
            <span className="eyebrow">Vertical Suites</span>
            <h2 className="section-head__title" style={{ marginTop: 8 }}>MX Suite</h2>
            <p className="card__desc" style={{ fontSize: 17, marginTop: 16, maxWidth: 780 }}>
              Pre-built switching tailored to a sector — deployed in weeks instead of years. Each
              suite ships with the integrations the vertical actually uses, so your team builds
              product, not plumbing.
            </p>
          </div>

          <div className="grid-3" style={{ marginTop: 48 }}>
            <MxCard delay={1} eyebrow="Education" name="MX Campus"
                    desc="Tuition, hostels, ID cards, levies — single rail across faculties."
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>} />
            <MxCard delay={2} eyebrow="Healthcare" name="MX Health"
                    desc="HMO claims, point-of-care collection, hospital billing."
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>} />
            <MxCard delay={3} eyebrow="Government" name="MX E-Gov"
                    desc="Treasury collection, IGR, levies, licensing — fully audited."
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
            <MxCard delay={1} eyebrow="Transport" name="MX Move"
                    desc="Cashless fare collection for BRT, ferry and intercity transit."
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17H3V6a1 1 0 0 1 1-1h10v12"/><path d="M14 9h4l3 4v4h-2"/></svg>} />
            <MxCard delay={2} eyebrow="Enterprise" name="MX Enterprise"
                    desc="Bulk payroll, vendor disbursement, treasury — hosted or on-prem."
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22V12a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v10"/><path d="M2 12V6a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v6"/></svg>} />
            <article className="card reveal" data-delay={3}
                     style={{ background: 'var(--cs-green-100)', borderColor: 'var(--cs-green-300)' }}>
              <div className="card__icon" style={{ background: 'var(--cs-green-700)', color: '#fff' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>
              <div className="eyebrow" style={{ color: 'var(--cs-green-900)' }}>Bespoke</div>
              <div className="card__name">Custom Solutions</div>
              <p className="card__desc">A switch profile built around your specific channels, schemes and SLAs.</p>
              <Link className="btn-arrow" to="/contact">Scope a build</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--paper" id="switching">
        <div className="container">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Infrastructure</div>
              <h2 className="section-head__title">Switching, processing & hosted services.</h2>
            </div>
            <p className="section-head__lede">
              The plumbing behind it all. Connecting issuers, acquirers, merchants, service
              providers and other switches.
            </p>
          </div>
          <div className="grid-3">
            <article className="card reveal" data-delay={1} id="switching-card">
              <div className="card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
                  <circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/>
                  <path d="M6 9v6m12-6v6M9 6h6m-6 12h6"/>
                </svg>
              </div>
              <div className="card__name">Switching & Processing</div>
              <p className="card__desc">Authorize, route and settle transactions in real time across schemes and acquirers — sub-200ms typical latency.</p>
            </article>
            <article className="card reveal" data-delay={2} id="hosted">
              <div className="card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/>
                  <path d="M3 5v14a9 3 0 0 0 18 0V5"/>
                  <path d="M3 12a9 3 0 0 0 18 0"/>
                </svg>
              </div>
              <div className="card__name">Hosted Services</div>
              <p className="card__desc">PCI-DSS hosted card management, tokenization and 3-D Secure — managed for you, audited annually.</p>
            </article>
            <article className="card reveal" data-delay={3} id="epayment">
              <div className="card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 12h20"/>
                </svg>
              </div>
              <div className="card__name">E-Payment Solutions</div>
              <p className="card__desc">Card issuance, ATM driving, POS acquiring, mobile banking, USSD — pick what you need, leave the rest.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container reveal">
          <div className="cta-band">
            <div>
              <h2 className="cta-band__title">Ready to integrate?</h2>
              <p className="cta-band__lede">
                Tell us your channels, schemes and volumes — a consultant will scope an integration
                plan within one working day.
              </p>
            </div>
            <div className="cta-band__actions">
              <Link className="btn btn--accent" to="/contact">Talk to a Consultant</Link>
              <Link className="btn btn--outline-green" to="/partners">Become a Partner</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function BillTile({ name, amount }: { name: string; amount: string }) {
  return (
    <div style={{ border: '1px solid var(--cs-line)', borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--cs-ink-100)', fontWeight: 600 }}>{name}</div>
      <div style={{ fontFamily: 'var(--cs-font-mono)', fontWeight: 600, marginTop: 6, color: 'var(--cs-ink-700)' }}>{amount}</div>
    </div>
  )
}

function MxCard({ delay, eyebrow, name, desc, icon }: {
  delay: number; eyebrow: string; name: string; desc: string; icon: React.ReactNode;
}) {
  return (
    <article className="card reveal" data-delay={delay}>
      <div className="card__icon">{icon}</div>
      <div className="eyebrow eyebrow--muted">{eyebrow}</div>
      <div className="card__name">{name}</div>
      <p className="card__desc">{desc}</p>
    </article>
  )
}
